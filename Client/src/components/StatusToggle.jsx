import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const StatusToggle = ({ initialStatus = false }) => {
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
    } catch (error) {
      console.error('Error toggling status', error);
      alert('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] border border-slate-800/50">
      <span className={`font-bold ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
        {isOnline ? 'Online & Available' : 'Offline'}
      </span>
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
          isOnline ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
            isOnline ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default StatusToggle;
