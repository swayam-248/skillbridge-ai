import React, { useState } from 'react';

const RatingStars = ({ rating, setRating, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => setRating(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`text-3xl transition-transform ${readOnly ? '' : 'hover:scale-110'}`}
        >
          <span className={`${star <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'}`}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    setLoading(true);
    await onSubmit(booking._id, rating, comment);
    setLoading(false);
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 font-bold">✕</button>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Leave a Review</h2>
        <p className="text-slate-500 mb-6 font-medium">Rate your experience for the completed job.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center py-4">
            <RatingStars rating={rating} setRating={setRating} />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Comment (Optional)</label>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium resize-none"
              placeholder="How did they do?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-70"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export { RatingStars, ReviewModal };
