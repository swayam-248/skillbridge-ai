import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReviewModal } from './ReviewModal';

const BookingsDashboard = ({ userRole }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/bookings/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (bookingId, rating, comment) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/reviews',
        { bookingId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewBooking(null);
      fetchBookings();
      alert('Review submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review.');
    }
  };

  if (loading) return <div className="text-center p-4">Loading Bookings...</div>;
  if (bookings.length === 0) return null;

  return (
    <div className="mt-12 bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50">
      <h2 className="text-2xl font-black text-white mb-6 border-b border-slate-800 pb-4">
        Your Bookings
      </h2>
      <div className="space-y-4">
        {bookings
          .filter((b) => {
            if (userRole === 'worker') {
              // Workers only want to see ongoing/pending tasks
              return b.status === 'pending' || b.status === 'accepted';
            }
            return true; // Recruiters see everything
          })
          .map((b) => (
          <div key={b._id} className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${
                b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                b.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {b.status}
              </span>
              <p className="text-slate-300 font-medium">{b.jobDescription}</p>
              {b.status === 'accepted' && (
                <div className="mt-3 p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg">
                  <p className="text-sm font-bold text-blue-400">Connection Details:</p>
                  <p className="text-sm text-blue-300">
                    {userRole === 'worker' ? `Recruiter: ${b.recruiter?.email}` : `Worker: ${b.worker?.email}`}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {userRole === 'worker' && b.status === 'pending' && (
                <button onClick={() => updateStatus(b._id, 'accepted')} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors">
                  Accept Job
                </button>
              )}
              {userRole === 'recruiter' && b.status === 'accepted' && (
                <button onClick={() => updateStatus(b._id, 'completed')} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors">
                  Mark Completed
                </button>
              )}
              {userRole === 'recruiter' && b.status === 'completed' && (
                <button onClick={() => setReviewBooking(b)} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30">
                  Leave Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
};

export default BookingsDashboard;
