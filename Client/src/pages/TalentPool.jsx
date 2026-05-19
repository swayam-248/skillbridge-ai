import React, { useEffect, useState } from "react";
import axios from "axios";
import { SkeletonGrid } from "../components/SkeletonCard";
import ErrorBoundary from "../components/ErrorBoundary";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

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
      <div className="space-y-8 p-6 bg-slate-950 min-h-screen">
        <div className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-800/50 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">Talent Pool</h2>
            <p className="text-slate-400 font-medium">Discover and connect with skilled workers</p>
          </div>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by name, email or skill..."
              className="w-full p-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => (
              <Link 
                to={`/profile/${profile.user?._id || profile._id}`} 
                key={profile._id}
                className="block group"
              >
                <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-xl group-hover:border-blue-500/50 group-hover:bg-slate-900/60 transition-all duration-300 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20">
                      {profile.fullName?.[0] || profile.user?.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-white font-bold text-xs">{profile.averageRating || "0.0"}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {profile.fullName || "Anonymous Worker"}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 truncate">
                      {profile.user?.email}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.length > 0 ? (
                        profile.skills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {typeof skill === 'string' ? skill : skill.professional_title}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600 text-[10px] uppercase font-black italic">No skills listed</span>
                      )}
                      {profile.skills?.length > 3 && (
                        <span className="text-slate-500 text-[10px] font-bold">+{profile.skills.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${profile.isOnline ? 'text-green-500' : 'text-slate-600'}`}>
                      ● {profile.isOnline ? 'Active Now' : 'Offline'}
                    </span>
                    <span className="text-blue-500 text-xs font-bold group-hover:translate-x-1 transition-transform">View Profile →</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800">
              <div className="text-5xl mb-4 opacity-20">🔍</div>
              <p className="text-slate-500 font-black uppercase tracking-widest">No workers found matching your search</p>
            </div>
          )}
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default TalentPool;
