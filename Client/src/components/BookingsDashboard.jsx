/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ReviewModal } from "./ReviewModal";
import { API_BASE_URL } from "../utils/api";

const statusConfig = {
  pending: {
    label: "Pending Response",
    badge: "badge-amber",
    dot: "bg-amber-500",
  },
  accepted: {
    label: "Accepted & Active",
    badge: "badge-blue",
    dot: "bg-blue-600",
  },
  completed: {
    label: "Completed",
    badge: "badge-emerald",
    dot: "bg-emerald-600",
  },
  cancelled: {
    label: "Cancelled",
    badge: "badge-rose",
    dot: "bg-rose-600",
  },
};

const BookingsDashboard = ({ userRole }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(Array.isArray(res.data) ? res.data : []);
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
      const token = sessionStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/bookings/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Error updating booking status.");
    }
  };

  const handleReviewSubmit = async (bookingId, rating, comment) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/reviews`,
        { bookingId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setReviewBooking(null);
      fetchBookings();
      alert("Review published successfully! Worker rating updated.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status === statusFilter;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const activeCount = bookings.filter((b) => b.status === "accepted").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            {userRole === "worker" ? "Worker Dispatch" : "Recruiter Hires"}
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Client Bookings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage real-time direct booking requests, unlock contact details, and review work.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-amber px-3 py-1">
            {pendingCount} Pending
          </span>
          <span className="badge badge-blue px-3 py-1">
            {activeCount} Active
          </span>
          <span className="badge badge-emerald px-3 py-1">
            {completedCount} Completed
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "all", label: `All (${bookings.length})` },
          { id: "pending", label: `Pending (${pendingCount})` },
          { id: "accepted", label: `Active (${activeCount})` },
          { id: "completed", label: `Completed (${completedCount})` },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">
          Loading bookings...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-bold text-slate-900 text-base">No bookings in this category</p>
          <p className="mt-1 text-xs text-slate-500">
            {userRole === "worker"
              ? "New client booking requests will appear here when recruiters book your profile."
              : "Direct bookings sent to workers from the talent pool will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const config = statusConfig[booking.status] || statusConfig.pending;
            const counterpart =
              userRole === "worker" ? booking.recruiter : booking.worker;

            return (
              <article key={booking._id} className="glass-card p-6 bg-white border border-slate-200">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${config.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(booking.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-slate-900 leading-relaxed">
                      {booking.jobDescription}
                    </h3>

                    {/* Unlocked Contact Details for Accepted Jobs */}
                    {booking.status === "accepted" && (
                      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                            🔓 Connection Unlocked
                          </p>
                          <span className="badge badge-emerald">Direct Match</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-800 font-medium">
                          <span className="font-semibold text-slate-900">
                            {userRole === "worker" ? "Recruiter Email" : "Worker Email"}:
                          </span>{" "}
                          {counterpart?.email}
                        </p>
                      </div>
                    )}

                    {booking.status === "completed" && booking.completedAt && (
                      <p className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <span>✓</span> Completed on{" "}
                        {new Date(booking.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {userRole === "worker" && booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(booking._id, "accepted")}
                          className="btn-primary"
                        >
                          ✓ Accept Job
                        </button>
                        <button
                          onClick={() => updateStatus(booking._id, "cancelled")}
                          className="btn-danger"
                        >
                          ✕ Decline
                        </button>
                      </>
                    )}

                    {userRole === "recruiter" && booking.status === "pending" && (
                      <button
                        onClick={() => updateStatus(booking._id, "cancelled")}
                        className="btn-danger"
                      >
                        Cancel Request
                      </button>
                    )}

                    {userRole === "recruiter" && booking.status === "accepted" && (
                      <button
                        onClick={() => updateStatus(booking._id, "completed")}
                        className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                      >
                        ✓ Mark Completed
                      </button>
                    )}

                    {userRole === "recruiter" && booking.status === "completed" && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="btn-secondary text-amber-700 border-amber-300 hover:border-amber-400 bg-amber-50"
                      >
                        ★ Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
