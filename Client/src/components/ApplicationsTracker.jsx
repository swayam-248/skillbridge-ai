/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import BookingModal from "./BookingModal";

const statusConfig = {
  pending: { label: "Under Review", badge: "badge-amber" },
  accepted: { label: "Accepted", badge: "badge-emerald" },
  rejected: { label: "Not Selected", badge: "badge-rose" },
  reviewed: { label: "Reviewed", badge: "badge-blue" },
};

const ApplicationsTracker = ({ userRole }) => {
  const [applications, setApplications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState(null);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/applications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/jobs?recruiter=me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplicants(Array.isArray(res.data) ? res.data : []);
      setSelectedJobId(jobId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/applications/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (selectedJobId) fetchApplicants(selectedJobId);
    } catch (err) {
      console.error(err);
      alert("Error updating application status.");
    }
  };

  const handleBookingSubmit = async (workerId, jobDescription) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/bookings`,
        { workerId, jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Direct booking request sent to candidate!");
      setSelectedWorkerForBooking(null);
    } catch (err) {
      console.error(err);
      alert("Failed to send booking request.");
    }
  };

  useEffect(() => {
    if (userRole === "worker") {
      fetchMyApplications();
    } else {
      fetchMyJobs();
    }
  }, [userRole]);

  if (userRole === "worker") {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Career Pipeline
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Submitted Applications
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track status updates for jobs you've applied to in real time.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-bold text-slate-900 text-base">No applications submitted yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Browse the Job Board to discover open positions and apply.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = statusConfig[app.status] || statusConfig.pending;

              return (
                <article key={app._id} className="glass-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200">
                  <div>
                    <span className={`badge ${config.badge}`}>
                      {config.label}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      {app.job?.title || "Role Opening"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Recruiter: {app.job?.recruiter?.email || "SkillBridge Client"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Submitted on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
                    {app.status === "accepted" ? (
                      <span className="text-emerald-700 font-bold">
                        🎉 Accepted! Recruiter will contact you or issue a booking.
                      </span>
                    ) : app.status === "rejected" ? (
                      <span className="text-rose-700 font-semibold">
                        Position filled or candidate profile not matched.
                      </span>
                    ) : (
                      <span>Application is actively being reviewed.</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Recruiter View
  const selectedJob = myJobs.find((j) => j._id === selectedJobId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Hiring Pipeline
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            {selectedJobId ? `Applicants for "${selectedJob?.title}"` : "Job Applicants Pool"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {selectedJobId
              ? "Review applicant skill profiles, accept or reject candidates, and initiate direct bookings."
              : "Select a job listing to review candidate submissions."}
          </p>
        </div>

        {selectedJobId && (
          <button
            onClick={() => setSelectedJobId(null)}
            className="btn-secondary text-xs"
          >
            ← Back to All Listings
          </button>
        )}
      </div>

      {!selectedJobId ? (
        myJobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="text-4xl mb-3">📢</div>
            <p className="font-bold text-slate-900 text-base">No active job listings</p>
            <p className="mt-1 text-xs text-slate-500">
              Create a job post in the "Post a Job" section to receive applicants.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {myJobs.map((job) => (
              <button
                key={job._id}
                onClick={() => fetchApplicants(job._id)}
                className="glass-card-hover p-6 text-left group bg-white border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-blue">Job Listing</span>
                  <span className="text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                    View Applicants →
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>
                <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )
      ) : loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading applicants...</div>
      ) : applicants.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="font-bold text-slate-900 text-base">No applicants yet for this job</p>
          <p className="mt-1 text-xs text-slate-500">
            Candidates who apply to this role will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => {
            const config = statusConfig[app.status] || statusConfig.pending;
            const profile = app.profile;

            return (
              <article key={app._id} className="glass-card p-6 bg-white border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 font-display text-xl font-bold text-white shadow-sm">
                      {profile?.fullName?.[0] || app.worker?.email?.[0]?.toUpperCase() || "W"}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg font-bold text-slate-900">
                          {profile?.fullName || "Anonymous Worker"}
                        </h3>
                        <span className={`badge ${config.badge}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{app.worker?.email}</p>

                      {/* Skills */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {profile?.skills && profile.skills.length > 0 ? (
                          profile.skills.map((skill, i) => (
                            <span key={i} className="skill-chip text-[11px]">
                              {typeof skill === "string" ? skill : skill.professional_title}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No skills listed yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recruiter Decision Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {app.status !== "accepted" && (
                      <button
                        onClick={() => handleUpdateStatus(app._id, "accepted")}
                        className="btn-primary text-xs"
                      >
                        ✓ Accept Candidate
                      </button>
                    )}
                    {app.status !== "rejected" && (
                      <button
                        onClick={() => handleUpdateStatus(app._id, "rejected")}
                        className="btn-danger text-xs"
                      >
                        ✕ Decline
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setSelectedWorkerForBooking({
                          _id: profile?._id || app.worker?._id,
                          user: app.worker?._id,
                          fullName: profile?.fullName || "Candidate",
                        })
                      }
                      className="btn-secondary text-xs"
                    >
                      📅 Direct Book
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedWorkerForBooking && (
        <BookingModal
          worker={selectedWorkerForBooking}
          onClose={() => setSelectedWorkerForBooking(null)}
          onSubmit={handleBookingSubmit}
          initialDescription={selectedJob ? `For position: ${selectedJob.title}` : ""}
        />
      )}
    </div>
  );
};

export default ApplicationsTracker;
