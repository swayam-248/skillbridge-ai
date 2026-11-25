import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function BookingChatModal({ booking, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { joinChat, leaveChat, chatMessageEvent } = useSocket() || {};

  const counterpart =
    currentUser?.role === 'worker' ? booking?.recruiter : booking?.worker;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Join the real-time socket room for this booking's chat
  useEffect(() => {
    if (booking?._id && joinChat) {
      joinChat(booking._id);
    }
    return () => {
      if (booking?._id && leaveChat) {
        leaveChat(booking._id);
      }
    };
  }, [booking?._id]);

  // Automatically close chat if the job is completed or cancelled by either party
  useEffect(() => {
    if (booking?.status === 'completed' || booking?.status === 'cancelled') {
      onClose();
    }
  }, [booking?.status, onClose]);

  // Load message history from MongoDB
  useEffect(() => {
    const fetchHistory = async () => {
      if (!booking?._id) return;
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/chat/${booking._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [booking?._id]);

  // Listen for real-time incoming messages for this active booking
  useEffect(() => {
    if (chatMessageEvent && chatMessageEvent.booking === booking?._id) {
      setMessages((prev) => {
        // Prevent duplicate append if message already exists
        if (prev.some((m) => m._id === chatMessageEvent._id)) return prev;
        return [...prev, chatMessageEvent];
      });
    }
  }, [chatMessageEvent, booking?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/chat/${booking._id}`,
        { message: content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Append locally if socket hasn't already appended
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col h-[600px] w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-display font-bold text-white shadow-sm">
              {counterpart?.email?.[0]?.toUpperCase() || 'C'}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-slate-900 truncate max-w-[200px]">
                  {counterpart?.email || 'Participant'}
                </h3>
                <span className="badge badge-emerald text-[10px] py-0 px-1.5">Live</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                Job: {booking.jobDescription}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Message Bubble History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="text-3xl mb-2">💬</div>
              <p className="font-bold text-slate-700 text-sm">Direct Match Chat</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Coordinate exact directions, gate codes, or arrival details safely in real time.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
              const isMe =
                senderId === currentUser?.userId ||
                senderId === currentUser?._id ||
                msg.senderRole === currentUser?.role;

              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '';

              return (
                <div
                  key={msg._id || Math.random()}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-xs ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{timeStr}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex h-9 items-center justify-center rounded-2xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

