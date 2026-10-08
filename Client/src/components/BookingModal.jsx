import React, { useState } from 'react';

const BookingModal = ({ worker, onClose, onSubmit, initialDescription = '' }) => {
  const [jobDescription, setJobDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    setLoading(true);
    await onSubmit(worker.user?._id || worker.user, jobDescription);
    setLoading(false);
  };

  if (!worker) return null;

  const workerName = worker.fullName || worker.name || "Skilled Worker";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 transition-all font-bold"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 font-display text-xl font-bold text-white shadow-md shadow-blue-500/20">
            {workerName[0]}
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-slate-900">Book {workerName}</h2>
            <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Available for real-time dispatch
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Job Scope & Requirements
            </label>
            <textarea
              required
              rows={4}
              className="glass-input resize-none"
              placeholder="e.g. Need urgent repair for leaking sink pipe in bathroom. Tools needed: Pipe wrench, replacement washer..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-800 leading-relaxed font-medium">
            🔒 Contact details (phone number & email) will unlock once {workerName} accepts your booking.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !jobDescription.trim()}
              className="btn-primary"
            >
              {loading ? 'Sending Request...' : 'Confirm & Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
