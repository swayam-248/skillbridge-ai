import React, { useState } from 'react';
import Soundwave from '../../components/Soundwave';
import { SkeletonGrid } from '../../components/SkeletonCard';
import { getCategoryStyle } from '../../utils/categoryStyles';
import { Link } from 'react-router-dom';

function RecruiterDashboard({
  isListening,
  toggleListen,
  problemText,
  setProblemText,
  searchTerm,
  setSearchTerm,
  filteredProfiles,
  loading,
  allProfiles,
  setSelectedWorkerForBooking,
}) {
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    "all",
    "Trade Services",
    "Hospitality",
    "Logistics & Transport",
    "Cleaning Services",
    "Retail",
    "Agriculture",
  ];

  const displayedProfiles = filteredProfiles.filter((p) => {
    if (onlineOnly && !p.isOnline) return false;
    if (selectedCategory !== "all") {
      const hasCat = p.skills?.some((s) => {
        const cat = typeof s === "object" ? s.category : "";
        return cat?.toLowerCase() === selectedCategory.toLowerCase();
      });
      if (!hasCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            AI Talent Pool & Discovery
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Find & Book Skilled Workers
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Describe your problem in plain words or by voice — our NLP engine instantly connects you with matching trade talent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-blue">
            {allProfiles.length} Total Workers
          </span>
          <span className="badge badge-emerald">
            {allProfiles.filter((p) => p.isOnline).length} Active Now
          </span>
        </div>
      </div>

      {/* Problem Solver Search Console */}
      <div className="glass-card p-8 space-y-6 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Describe the Job or Problem
              </h2>
              <p className="text-xs text-slate-500">
                Natural language problem matching converts symptoms into exact trade skills
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Soundwave isListening={isListening} />
            <button
              type="button"
              onClick={toggleListen}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "btn-secondary text-blue-700 border-blue-200 bg-blue-50/60 hover:bg-blue-50"
              }`}
            >
              <span>{isListening ? "🛑 Stop Voice Search" : "🎤 Use Voice Search"}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div>
            <textarea
              rows={3}
              placeholder="e.g. 'My kitchen faucet is leaking and water pipe needs replacement' or 'Need someone to wire outdoor floodlights'..."
              className="glass-input resize-none"
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Or Search by Name / Keyword
              </label>
              <input
                type="text"
                placeholder="Plumber, Electrician, Swayam..."
                className="glass-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Active & Online Only</span>
              </label>

              {(problemText || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setProblemText("");
                    setSearchTerm("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Categories:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1 text-[11px] font-bold capitalize transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-slate-900">
          Matched Labor Experts ({displayedProfiles.length})
        </h3>
        {problemText && (
          <span className="text-xs text-blue-700 font-semibold">
            Showing results matching your problem description
          </span>
        )}
      </div>

      {/* Talent Grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : displayedProfiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h4 className="font-bold text-slate-900 text-base">No matching workers found</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Try a broader keyword, clear the "Online Only" filter, or search for related trade terms.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayedProfiles.map((profile) => {
            const name = profile.fullName || profile.name || "Anonymous Worker";
            const initial = name[0] || profile.user?.email?.[0]?.toUpperCase() || "W";

            return (
              <article key={profile._id} className="glass-card-hover p-6 flex flex-col justify-between bg-white border border-slate-200">
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 font-display text-lg font-bold text-white shadow-sm">
                        {initial}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                            profile.isOnline ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-slate-900 text-base truncate">
                          {name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {profile.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                      <span className="text-xs">★</span>
                      <span className="text-xs font-black">{profile.averageRating || profile.rating || "0.0"}</span>
                    </div>
                  </div>

                  {/* Skills Chips */}
                  <div className="mt-5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Top Verified Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.slice(0, 4).map((skill, i) => {
                          const title = typeof skill === "string" ? skill : skill.professional_title;
                          const cat = typeof skill === "object" ? skill.category : "default";

                          return (
                            <span
                              key={i}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${getCategoryStyle(
                                cat
                              )}`}
                            >
                              {title}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic">No skills listed</span>
                      )}
                      {profile.skills?.length > 4 && (
                        <span className="badge badge-slate text-[10px]">
                          +{profile.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/profile/${profile.user?._id || profile.user || profile._id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    View Details →
                  </Link>

                  <button
                    onClick={() => setSelectedWorkerForBooking(profile)}
                    disabled={!profile.isOnline}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      profile.isOnline
                        ? "btn-primary shadow-xs"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    }`}
                  >
                    {profile.isOnline ? "⚡ Book Now" : "Currently Offline"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;
