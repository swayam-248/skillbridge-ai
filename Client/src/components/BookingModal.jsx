import React, { useState } from 'react';

const BookingModal = ({ worker, onClose, onSubmit, initialDescription = '' }) => {
  const [jobDescription, setJobDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(worker.user?._id || worker.user, jobDescription);
    setLoading(false);
  };

  if (!worker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 font-bold"
        >
          ✕
        </button>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Book Worker</h2>
        <p className="text-slate-500 mb-6 font-medium">Request {worker.name || worker.fullName}'s services.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Job Description</label>
            <textarea
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none min-h-[120px]"
              placeholder="Describe what you need help with..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70"
          >
            {loading ? 'Sending Request...' : 'Send Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
