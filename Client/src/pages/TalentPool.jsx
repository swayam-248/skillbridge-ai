import React, { useEffect, useState } from "react";
import axios from "axios";
import { SkeletonGrid } from "../components/SkeletonCard";
import ErrorBoundary from "../components/ErrorBoundary";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import { getCategoryStyle } from "../utils/categoryStyles";

const TalentPool = () => {
  const [allProfiles, setAllProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = sessionStorage.getItem("token"); 
        const res = await axios.get(`${API_BASE_URL}/api/profiles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllProfiles(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setAllProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const filteredProfiles = allProfiles.filter((profile) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = (profile.fullName || profile.user?.email)?.toLowerCase().includes(term);
    const matchesSkills = profile.skills?.some((s) => {
      const title = typeof s === 'string' ? s : s.professional_title;
      return title?.toLowerCase().includes(term);
    });
    return matchesName || matchesSkills;
  });

  return (
    <ErrorBoundary>
      <div className="space-y-8 p-6 md:p-10 bg-slate-50 min-h-screen text-slate-900">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Link to="/dashboard" className="btn-secondary text-xs">
              ← Return to Dashboard
            </Link>
            <span className="badge badge-blue">Recruiter Talent Pool</span>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight mb-2">
                Talent Pool
              </h2>
              <p className="text-slate-600 font-medium text-sm">
                Discover and connect with verified trade workers and skilled craftsmen.
              </p>
            </div>
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search by worker name or skill..."
                className="glass-input pl-11 shadow-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <Link 
                    to={`/profile/${profile.user?._id || profile._id}`} 
                    key={profile._id}
                    className="block group"
                  >
                    <div className="glass-card-hover p-7 bg-white border border-slate-200 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-5">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20">
                            {profile.fullName?.[0] || profile.user?.email?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            <span className="text-amber-500 text-sm">★</span>
                            <span className="text-amber-900 font-bold text-xs">{profile.averageRating || "0.0"}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl font-extrabold text-slate-950 mb-1 group-hover:text-blue-600 transition-colors">
                            {profile.fullName || "Anonymous Worker"}
                          </h3>
                          <p className="text-slate-500 font-medium text-xs mb-5 truncate">
                            {profile.user?.email}
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills?.length > 0 ? (
                              profile.skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="skill-chip text-[11px]">
                                  {typeof skill === 'string' ? skill : skill.professional_title}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs italic">No skills listed</span>
                            )}
                            {profile.skills?.length > 3 && (
                              <span className="badge badge-slate text-[10px]">+{profile.skills.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${profile.isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                          <span className={`h-2 w-2 rounded-full ${profile.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {profile.isOnline ? 'Active Now' : 'Offline'}
                        </span>
                        <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                          View Profile →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-slate-600 font-bold text-base">No workers found matching your search</p>
                  <p className="text-xs text-slate-400 mt-1">Try another term or clear the search query.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TalentPool;
