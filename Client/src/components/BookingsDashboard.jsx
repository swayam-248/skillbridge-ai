/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ReviewModal } from "./ReviewModal";
import BookingChatModal from "./BookingChatModal";
import LiveJobTrackerModal from "./LiveJobTrackerModal";
import { API_BASE_URL } from "../utils/api";
import { useSocket } from "../context/SocketContext";

const statusConfig = {
  pending: {
    label: "Pending Response",
    badge: "badge-amber",
    dot: "bg-amber-500",
  },
  accepted: {
    label: "Accepted & En Route",
    badge: "badge-blue",
    dot: "bg-blue-600",
  },
  in_progress: {
    label: "Work In Progress 🛠️",
    badge: "badge-indigo bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-600",
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
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [otpInputs, setOtpInputs] = useState({});
  const [otpError, setOtpError] = useState({});

  const { lastStatusUpdate, newBookingEvent, chatNotification } = useSocket() || {};

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

  // Real-time synchronization when a new booking is created
  useEffect(() => {
    if (newBookingEvent && newBookingEvent._id) {
      setBookings((prev) => {
        if (prev.some((b) => b._id === newBookingEvent._id)) return prev;
        return [newBookingEvent, ...prev];
      });
    }
  }, [newBookingEvent]);

  // Real-time synchronization when a booking status changes
  useEffect(() => {
    if (lastStatusUpdate && lastStatusUpdate._id) {
      setBookings((prev) => {
        const index = prev.findIndex((b) => b._id === lastStatusUpdate._id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...lastStatusUpdate };
          return updated;
        }
        return [lastStatusUpdate, ...prev];
      });

      // Also update currently active chat booking if applicable
      if (activeChatBooking && activeChatBooking._id === lastStatusUpdate._id) {
        setActiveChatBooking((prev) => ({ ...prev, ...lastStatusUpdate }));
      }

      // Also update currently active tracking modal if applicable
      if (activeTrackingBooking && activeTrackingBooking._id === lastStatusUpdate._id) {
        setActiveTrackingBooking((prev) => ({ ...prev, ...lastStatusUpdate }));
      }
    }
  }, [lastStatusUpdate]);

  const updateStatus = async (id, status, extraData = {}) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/bookings/${id}/status`,
        { status, ...extraData },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Update local state immediately
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, ...res.data } : b))
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error updating booking status.");
      throw err;
    }
  };

  const verifyAndStartJob = async (bookingId) => {
    const code = otpInputs[bookingId]?.trim();
    if (!code || code.length !== 4) {
      setOtpError({ ...otpError, [bookingId]: "Please enter the 4-digit OTP" });
      return;
    }
    setOtpError({ ...otpError, [bookingId]: "" });

    try {
      await updateStatus(bookingId, "in_progress", { otp: code });
    } catch (err) {
      setOtpError({
        ...otpError,
        [bookingId]: err.response?.data?.message || "Invalid OTP code",
      });
    }
  };

  const handleStartJobWithOtp = async (bookingId, otpCode) => {
    try {
      await updateStatus(bookingId, "in_progress", { otp: otpCode });
      if (activeTrackingBooking && activeTrackingBooking._id === bookingId) {
        setActiveTrackingBooking((prev) => ({ ...prev, status: "in_progress" }));
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid OTP code",
      };
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
  const activeCount = bookings.filter(
    (b) => b.status === "accepted" || b.status === "in_progress"
  ).length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
            Real-time direct bookings, live in-app chat, and doorstep OTP verification.
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

            // Chat is only available while work is active; once completed or cancelled, it is completely removed
            const canChat =
              booking.status === "accepted" || booking.status === "in_progress";

            return (
              <article key={booking._id} className="glass-card p-6 bg-white border border-slate-200 shadow-xs">
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
                      {booking.totalAmount && (
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          ₹{booking.totalAmount}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-bold text-slate-900 leading-relaxed">
                      {booking.jobDescription}
                    </h3>

                    {booking.serviceAddress && (
                      <p className="mt-1 text-xs text-slate-600 font-medium">
                        📍 Service Address: <span className="font-semibold">{booking.serviceAddress}</span>
                      </p>
                    )}

                    {/* Unlocked Contact Details for Accepted / In Progress Jobs */}
                    {canChat && (
                      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                            🔓 Connection Unlocked
                          </p>
                          <span className="badge badge-emerald">Direct Match</span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium">
                          <span className="font-semibold text-slate-900">
                            {userRole === "worker" ? "Recruiter Contact" : "Worker Contact"}:
                          </span>{" "}
                          {counterpart?.email}
                        </p>
                      </div>
                    )}

                    {/* DOORSTEP OTP VERIFICATION BOX */}
                    {booking.status === "accepted" && userRole === "recruiter" && (
                      <div className="mt-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                            🔑 Doorstep Start OTP
                          </p>
                          <span className="badge badge-blue">Give Code to Worker</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Share this 4-digit security code with the pro when they arrive at your door to start work:
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-300 font-mono text-2xl font-black text-blue-600 tracking-widest shadow-xs">
                          {booking.startOtp || "4821"}
                        </div>
                      </div>
                    )}

                    {booking.status === "accepted" && userRole === "worker" && (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 space-y-2">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                          🚪 Doorstep Verification: Ask Customer for 4-Digit OTP
                        </p>
                        <p className="text-xs text-slate-600">
                          Enter the code given by the customer to verify your presence and start work:
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="4-digit code"
                            value={otpInputs[booking._id] || ""}
                            onChange={(e) =>
                              setOtpInputs({ ...otpInputs, [booking._id]: e.target.value })
                            }
                            className="w-32 rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-mono text-center text-lg font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => verifyAndStartJob(booking._id)}
                            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
                          >
                            Verify & Start Work
                          </button>
                        </div>
                        {otpError[booking._id] && (
                          <p className="text-xs text-rose-600 font-bold">{otpError[booking._id]}</p>
                        )}
                      </div>
                    )}

                    {booking.status === "in_progress" && (
                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                          </span>
                          <span className="text-xs font-bold text-indigo-900">
                            Work currently in progress at job site
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-700">
                          Doorstep Verified ✓
                        </span>
                      </div>
                    )}

                    {booking.status === "completed" && booking.completedAt && (
                      <p className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <span>✓</span> Completed on{" "}
                        {new Date(booking.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {/* Uber-Style Live GPS Navigation / Live Tracking Button */}
                    {canChat && (
                      <button
                        type="button"
                        onClick={() => setActiveTrackingBooking(booking)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:from-blue-700 hover:to-indigo-800 transition shadow-sm shadow-blue-500/25"
                      >
                        {userRole === "worker" ? (
                          <>
                            <span>🧭</span>
                            <span>Live GPS Navigation</span>
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>🗺️ Track Pro Live (Uber View)</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Live In-App Chat Button */}
                    {canChat && (
                      <button
                        type="button"
                        onClick={() => setActiveChatBooking(booking)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
                      >
                        <span>💬</span>
                        <span>Live Chat</span>
                        {chatNotification && chatNotification.bookingId === booking._id && (
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </button>
                    )}

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

                    {/* Completion button when accepted or in_progress */}
                    {(booking.status === "accepted" || booking.status === "in_progress") && (
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

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Real-time In-App Live Chat Modal */}
      {activeChatBooking && (
        <BookingChatModal
          booking={activeChatBooking}
          currentUser={{ role: userRole }}
          onClose={() => setActiveChatBooking(null)}
        />
      )}

      {/* Real-time Uber Live GPS Tracking & Driver Navigation Modal */}
      {activeTrackingBooking && (
        <LiveJobTrackerModal
          booking={activeTrackingBooking}
          currentUserRole={userRole}
          onClose={() => setActiveTrackingBooking(null)}
          onStartJobWithOtp={handleStartJobWithOtp}
          onCompleteJob={(bookingId) => updateStatus(bookingId, "completed")}
        />
      )}
    </div>
  );
};

export default BookingsDashboard;
