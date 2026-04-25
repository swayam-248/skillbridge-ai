import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import { Link } from "react-router-dom";

const TalentPool = () => {
  const [allProfiles, setAllProfiles] = useState(null); // Start with null for defensive check
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/profiles", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure we are setting an array
        setAllProfiles(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setAllProfiles([]); // Fallback to empty array
        setLoading(false);
      }
    };
    fetchProfiles();

    // Cleanup state on unmount
    return () => {
      setAllProfiles(null);
      setSearchTerm("");
    };
  }, []);

  // Function to determine color based on match score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const filteredProfiles = Array.isArray(allProfiles)
    ? allProfiles.filter((profile) => {
        const term = searchTerm.toLowerCase();
        // Defensive checks for filtering
        const matchesName = (profile.fullName || profile.name)?.toLowerCase().includes(term);
        const matchesSkills = profile.skills?.some((s) =>
          s.professional_title?.toLowerCase().includes(term)
        );
        return matchesName || matchesSkills;
      })
    : [];

  if (loading) return <LoadingSpinner />;

  return (
    <ErrorBoundary>
      <div className="space-y-8 p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-100">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Talent Pool
          </h2>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by name or skill..."
              className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Defensive Rendering: Only render if allProfiles is an array */}
        {Array.isArray(allProfiles) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white hover:scale-[1.02] transition-all group"
                >
                  {/* The Match Score Badge */}
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(profile.matchScore || 75)}`}>
                    {profile.matchScore || 75}% Match
                  </div>

                  <h3>{profile.fullName}</h3>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                      {profile.fullName || profile.name || "Anonymous User"}
                    </h3>
                    <p className="text-blue-600 font-bold text-sm">
                      {profile.user?.email || profile.phone || "No contact info"}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Safe mapping using optional chaining */}
                    {profile.skills?.map((s, i) => (
                      
                      <><span
                        key={i}
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 bg-slate-50 text-slate-600 border-slate-100"
                      >
                        {s.professional_title}
                      </span><Link to={`/profile/${profile._id}`} key={profile._id} className="no-underline">
                          <div className="antigravity-card hover:shadow-lg transition-shadow">
                            <h3>{profile.fullName}</h3>
                            <p>{profile.skills?.[0]}</p>
                          </div>
                        </Link></>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest">
                  No matching workers found
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-amber-50 text-amber-700 rounded-2xl border border-amber-200">
            Unable to display talent pool data.
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default TalentPool;

