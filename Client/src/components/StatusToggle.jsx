import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StatusToggle = ({ initialStatus = false }) => {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsOnline(initialStatus);
  }, [initialStatus]);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const newStatus = !isOnline;
      await axios.put(
        'http://localhost:5000/api/profile/status',
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
    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <span className={`font-bold ${isOnline ? 'text-green-600' : 'text-slate-500'}`}>
        {isOnline ? 'Online & Available' : 'Offline'}
      </span>
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
          isOnline ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-300'
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
