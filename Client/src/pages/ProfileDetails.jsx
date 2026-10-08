import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { getCategoryStyle } from "../utils/categoryStyles";
import BookingModal from "../components/BookingModal";

const ProfileDetail = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);

  const fetchSingleProfile = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/profiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSingleProfile();
  }, [id]);

  const handleBookingSubmit = async (workerId, jobDescription) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/bookings`,
        { workerId, jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Booking request submitted successfully!");
      setBookingOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error sending booking request.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
        <div>Loading profile portfolio...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="glass-card p-10 text-center max-w-md bg-white border border-slate-200">
          <p className="text-xl font-bold text-slate-900">Worker profile not found</p>
          <Link to="/dashboard" className="btn-primary mt-6 text-xs">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const initial = profile.fullName?.[0] || profile.user?.email?.[0]?.toUpperCase() || "W";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="btn-secondary text-xs"
          >
            ← Back to Dashboard
          </Link>
          <span className="badge badge-blue">Verified Laborer Profile</span>
        </div>

        {/* Hero Card */}
        <div className="glass-card p-8 md:p-10 bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 font-display text-3xl font-extrabold text-white shadow-md shadow-blue-500/20">
                {initial}
                <span
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${
                    profile.isOnline ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-extrabold text-slate-900">
                    {profile.fullName || "Anonymous Worker"}
                  </h1>
                  <span
                    className={`badge ${
                      profile.isOnline ? "badge-emerald" : "badge-slate"
                    }`}
                  >
                    {profile.isOnline ? "● Available Now" : "○ Offline"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{profile.user?.email}</p>
                {profile.bio && (
                  <p className="text-xs text-slate-600 mt-3 max-w-xl leading-relaxed font-medium">
                    "{profile.bio}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800">
                <span className="text-xl text-amber-500">★</span>
                <span className="font-display text-2xl font-black">
                  {profile.averageRating || profile.rating || "0.0"}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({profile.reviewCount || 0} reviews)
                </span>
              </div>

              <button
                onClick={() => setBookingOpen(true)}
                className="btn-primary text-sm w-full md:w-auto"
              >
                ⚡ Request Direct Booking
              </button>
            </div>
          </div>
        </div>

        {/* Skills Portfolio Grid */}
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="glass-card p-7 bg-white border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Professional Skills
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    AI-verified through voice transcript and experience evaluation.
                  </p>
                </div>
                <span className="badge badge-blue">
                  {profile.skills?.length || 0} Registered
                </span>
              </div>

              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {profile.skills.map((skill, i) => {
                    const title = typeof skill === "string" ? skill : skill.professional_title;
                    return (
                      <span
                        key={i}
                        className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${getCategoryStyle(
                          skill.category
                        )}`}
                      >
                        ✓ {title}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
              )}
            </div>

            {/* Work History */}
            <div className="glass-card p-7 bg-white border border-slate-200">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
                Completed Job Logs
              </h2>
              {profile.workHistory && profile.workHistory.length > 0 ? (
                <div className="space-y-3">
                  {profile.workHistory.map((job) => (
                    <div
                      key={job._id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {job.jobDescription}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Completed on {new Date(job.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No completed jobs recorded yet on this profile.
                </p>
              )}
            </div>
          </div>

          {/* Client Reviews */}
          <div className="glass-card p-7 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Client Reviews
              </h2>
              <span className="badge badge-amber">
                ★ {profile.averageRating || profile.rating || "0.0"}
              </span>
            </div>

            {profile.reviews && profile.reviews.length > 0 ? (
              <div className="space-y-4">
                {profile.reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-amber-500 text-sm font-black">
                        {"★".repeat(rev.rating)}
                        <span className="text-slate-300">
                          {"★".repeat(Math.max(0, 5 - rev.rating))}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Client reviews will appear after completing direct bookings.
              </p>
            )}
          </div>
        </div>
      </div>

      {bookingOpen && (
        <BookingModal
          worker={profile}
          onClose={() => setBookingOpen(false)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  );
};

export default ProfileDetail;
