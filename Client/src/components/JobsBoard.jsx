/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const JobsBoard = ({ userRole }) => {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posting, setPosting] = useState(false);
  const [applyingId, setApplyingId] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const url =
        userRole === "recruiter"
          ? `${API_BASE_URL}/api/jobs?recruiter=me`
          : `${API_BASE_URL}/api/jobs`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(Array.isArray(res.data) ? res.data : []);

      if (userRole === "worker") {
        const appsRes = await axios.get(`${API_BASE_URL}/api/applications/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [userRole]);

  const handlePostJob = async (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setPosting(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/jobs`,
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTitle("");
      setDescription("");
      fetchJobs();
      alert("Job posting published successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to post job");
    } finally {
      setPosting(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      setApplyingId(jobId);
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/jobs/${jobId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Applied successfully! Recruiter has been notified.");
      fetchJobs();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error applying for job.";
      alert(msg);
    } finally {
      setApplyingId(null);
    }
  };

  const appliedJobIds = new Set(
    myApplications.map((app) => (app.job?._id || app.job))
  );

  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.recruiter?.email?.toLowerCase().includes(q)
    );
  });

  if (userRole === "recruiter") {
    return (
      <div className="space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Recruiter Tools
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Job Board & Open Roles
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Post open positions for trade and skilled labor candidates to apply.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Post Form */}
          <div className="glass-card p-7 bg-white border border-slate-200">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
              Create New Job Opening
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Detail the scope, location, and requirements.
            </p>

            <form onSubmit={handlePostJob} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Role Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input"
                  placeholder="e.g. Certified Industrial Electrician / Plumbing Technician"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Scope & Requirements
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input resize-none"
                  placeholder="Describe duties, expected tools, schedule, location, and payment terms..."
                />
              </div>

              <button
                type="submit"
                disabled={posting}
                className="btn-primary w-full"
              >
                {posting ? "Publishing Job..." : "Publish Job Opening"}
              </button>
            </form>
          </div>

          {/* Recruiter's Posted Jobs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Your Active Listings
              </h2>
              <span className="badge badge-blue">{jobs.length} Posted</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading listings...</div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                You haven't posted any jobs yet. Create your first opening using the form.
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job._id} className="glass-card p-5 space-y-2 bg-white border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                    <span className="badge badge-emerald">Open</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Worker View
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Work Opportunities
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Available Jobs
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse openings posted by verified recruiters and apply with one click.
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search roles or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">💼</div>
          <p className="font-bold text-slate-900 text-base">No open positions found</p>
          <p className="mt-1 text-xs text-slate-500">
            Check back soon as recruiters publish new opportunities regularly.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => {
            const hasApplied = appliedJobIds.has(job._id);

            return (
              <article key={job._id} className="glass-card-hover p-6 flex flex-col justify-between bg-white border border-slate-200">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="badge badge-blue">
                      Verified Recruiter
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">{job.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    Recruiter: {job.recruiter?.email}
                  </p>

                  <p className="mt-4 text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {job.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {hasApplied ? (
                    <button
                      disabled
                      className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 cursor-default"
                    >
                      ✓ Application Submitted
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={applyingId === job._id}
                      className="btn-primary w-full text-xs"
                    >
                      {applyingId === job._id ? "Submitting..." : "Apply for Position"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobsBoard;
