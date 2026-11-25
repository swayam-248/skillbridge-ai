import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

export default function IncomingJobModal({ dispatchData, onClose, onAccepted }) {
  const [timeLeft, setTimeLeft] = useState(dispatchData?.timeoutSeconds || 30);
  const [submitting, setSubmitting] = useState(false);
  const audioCtxRef = useRef(null);

  // Play subtle incoming alert chime using Web Audio API
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const playTone = (freq, start, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };

        // Two-tone alert chime
        playTone(587.33, 0, 0.2); // D5
        playTone(880.00, 0.2, 0.4); // A5
      }
    } catch (e) {
      console.warn('Audio chime unsupported or blocked:', e);
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // 30-second countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleDecline();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/api/bookings/${dispatchData.bookingId}/status`,
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onAccepted) onAccepted(res.data);
      onClose();
    } catch (err) {
      console.error('Error accepting job:', err);
      alert(err.response?.data?.message || 'Could not accept job.');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/bookings/${dispatchData.bookingId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn('Decline error:', err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  if (!dispatchData) return null;

  const totalTime = dispatchData.timeoutSeconds || 30;
  const progressPercent = (timeLeft / totalTime) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
        {/* Animated Countdown Progress Ring */}
        <div className="flex flex-col items-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* Pulsing beacon background */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <svg className="h-24 w-24 -rotate-90 transform">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="text-blue-600 transition-all duration-1000 ease-linear"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-black text-slate-900">{timeLeft}s</span>
            </div>
          </div>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700">
            ⚡ Instant Radar Dispatch
          </span>
          <h2 className="font-display text-xl font-extrabold text-slate-900 mt-1">
            New Job Request Nearby!
          </h2>
        </div>

        {/* Job Details Card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Job Description
            </span>
            <p className="text-sm font-semibold text-slate-800 line-clamp-3 mt-0.5">
              "{dispatchData.jobDescription}"
            </p>
          </div>

          {dispatchData.serviceAddress && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Service Address
              </span>
              <p className="text-xs font-medium text-slate-700 mt-0.5">
                📍 {dispatchData.serviceAddress}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Fare
              </span>
              <p className="text-base font-extrabold text-emerald-600">
                ₹{dispatchData.totalAmount || 299}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {dispatchData.recruiter?.email || 'Homeowner'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleDecline}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Decline
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleAccept}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition"
          >
            {submitting ? 'Connecting...' : '⚡ Accept Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

