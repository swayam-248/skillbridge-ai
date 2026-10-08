import React, { useState } from 'react';

const RatingStars = ({ rating, setRating, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => setRating && setRating(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`text-3xl transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-125 cursor-pointer'}`}
        >
          <span className={`${star <= (hover || rating) ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300'}`}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    setLoading(true);
    await onSubmit(booking._id, rating, comment);
    setLoading(false);
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 transition-all font-bold"
        >
          ✕
        </button>
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Feedback & Reputation</span>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">Rate Completed Job</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your review updates the worker's public reputation score in real time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 py-5">
            <RatingStars rating={rating} setRating={setRating} />
            <span className="mt-2 text-xs font-bold text-amber-700">
              {rating === 5 ? 'Exceptional 5/5' : rating === 4 ? 'Great 4/5' : rating === 3 ? 'Average 3/5' : rating === 2 ? 'Below Expectations 2/5' : 'Needs Improvement 1/5'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Comment or Recommendation
            </label>
            <textarea
              className="glass-input resize-none"
              rows={3}
              placeholder="Describe work quality, punctuality, and professionalism..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
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
              disabled={loading}
              className="btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {loading ? 'Submitting...' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { RatingStars, ReviewModal };
export default ReviewModal;
