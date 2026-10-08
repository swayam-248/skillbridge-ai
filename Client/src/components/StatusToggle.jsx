/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const StatusToggle = ({ initialStatus = false, onStatusChange }) => {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsOnline(initialStatus);
  }, [initialStatus]);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const newStatus = !isOnline;
      await axios.put(
        `${API_BASE_URL}/api/profile/status`,
        { isOnline: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOnline(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (error) {
      console.error('Error toggling status', error);
      alert('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3 items-center justify-center">
          {isOnline ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </>
          ) : (
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {isOnline ? 'Active & Ready for Hire' : 'Currently Offline'}
          </p>
          <p className="text-xs text-slate-500">
            {isOnline
              ? 'Recruiters can discover you in real time'
              : 'Toggle online to receive booking requests'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleStatus}
        disabled={loading}
        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus:outline-none disabled:opacity-50 ${
          isOnline
            ? 'border-emerald-500 bg-emerald-600 shadow-sm shadow-emerald-500/20'
            : 'border-slate-300 bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
            isOnline ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default StatusToggle;
