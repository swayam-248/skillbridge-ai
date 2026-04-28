import React, { useState, useEffect, useContext } from "react";
import { matchSkills } from "./services/nlpService";
import { createRecognizer } from "./services/voiceService";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import TalentPool from "./pages/TalentPool";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import ProfileDetail from "./pages/ProfileDetails";
import axios from "axios";
import StatusToggle from "./components/StatusToggle";
import BookingModal from "./components/BookingModal";
import BookingsDashboard from "./components/BookingsDashboard";


const getCategoryStyle = (category) => {
  const normalized = category ? category.toLowerCase().trim() : "default";
  const styles = {
    agriculture: "bg-green-950/50 text-green-400 border-green-800/50 shadow-sm shadow-green-900/20",
    "trade services": "bg-amber-950/50 text-amber-400 border-amber-800/50 shadow-sm shadow-amber-900/20",
    hospitality: "bg-orange-950/50 text-orange-400 border-orange-800/50 shadow-sm shadow-orange-900/20",
    "logistics & transport": "bg-blue-950/50 text-blue-400 border-blue-800/50 shadow-sm shadow-blue-900/20",
    "cleaning services": "bg-purple-950/50 text-purple-400 border-purple-800/50 shadow-sm shadow-purple-900/20",
    retail: "bg-pink-950/50 text-pink-400 border-pink-800/50 shadow-sm shadow-pink-900/20",
    landscaping: "bg-emerald-950/50 text-emerald-400 border-emerald-800/50 shadow-sm shadow-emerald-900/20",
    default: "bg-slate-800/50 text-slate-300 border-slate-700/50 shadow-sm shadow-slate-900/20",
  };
  return styles[normalized] || styles.default;
};

function App() {
  const [input, setInput] = useState("");
  const [foundSkills, setFoundSkills] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [dbSkills, setDbSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const { user, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("worker");
  const [allProfiles, setAllProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState(null);

  useEffect(() => {
    const fetchSkillsFromDB = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/skills");
        if (!response.ok) throw new Error("Failed to reach server");
        const data = await response.json();
        setDbSkills(data);
      } catch (err) {
        setError("Database Connection Failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchSkillsFromDB();
  }, []);

  useEffect(() => {
    if (dbSkills.length === 0) return;
    const rec = createRecognizer(
      (transcript) => {
        setInput(transcript);
        setFoundSkills(matchSkills(transcript, dbSkills));
      },
      () => setIsListening(false),
    );
    setRecognizer(rec);
  }, [dbSkills]);

  const fetchAllProfiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/profiles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAllProfiles(Array.isArray(data) ? data : []);
      setActiveTab("recruiter");
    } catch (err) {
      console.error("Error loading profiles:", err);
      setAllProfiles([]);
      setActiveTab("recruiter");
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (mode) => {
    // Defensive: Stop recognizer if it's active when switching modes
    if (isListening && recognizer) {
      recognizer.stop();
      setIsListening(false);
    }

    if (mode === "worker") {
      setActiveTab("worker");
      setAllProfiles([]); // Clear profiles when switching to worker to prevent leaks
      setSearchTerm("");
    } else {
      fetchAllProfiles();
    }
  };

  const handleBookingSubmit = async (workerId, jobDescription) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/bookings",
        { workerId, jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Booking request sent successfully!");
      setSelectedWorkerForBooking(null);
    } catch (err) {
      console.error(err);
      alert("Error sending booking request.");
    }
  };

  const handleSaveProfile = async () => {
    if (!userName || !userPhone || foundSkills.length === 0) {
      alert("Please enter details and identify some skills first!");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to save your profile!");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/profiles", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName,
          phone: userPhone,
          skills: foundSkills,
        }),
      });
      if (response.ok) {
        setSaveStatus("✅ Profile Saved Successfully!");
        setUserName("");
        setUserPhone("");
        setInput("");
        setFoundSkills([]);
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        const errData = await response.json();
        console.error("Backend Error:", errData);
        setSaveStatus(`❌ Error: ${errData.message || "Failed to save profile."}`);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("❌ Network error saving profile.");
    }
  };

  const toggleListen = () => {
    if (!recognizer) return;
    if (isListening) {
      recognizer.stop();
      setIsListening(false);
    } else {
      setInput("");
      setFoundSkills([]);
      recognizer.start();
      setIsListening(true);
    }
  };

  const resetProfile = () => {
    setInput("");
    setFoundSkills([]);
  };

  const groupedSkills = foundSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term); // This keeps the input field feeling responsive

    try {
      const token = localStorage.getItem("token");

      // 2. We call the NEW backend route with the search term as a "Query Parameter"
      const res = await axios.get(
        `http://localhost:5000/api/profiles?skill=${term}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // 3. Update the state with the filtered results from the DATABASE
      setAllProfiles(res.data);
    } catch (err) {
      console.error("Backend search failed:", err);
    }
  };

  const downloadProfile = () => {
    if (foundSkills.length === 0) return;
    const profileText = Object.entries(groupedSkills)
      .map(
        ([cat, sks]) =>
          `[${cat.toUpperCase()}]\n${sks.map((s) => `• ${s.professional_title}`).join("\n")}\n`,
      )
      .join("\n");
    const element = document.createElement("a");
    const file = new Blob([`SKILLBRIDGE AI REPORT\n${profileText}`], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = "SkillBridge_Profile.txt";
    document.body.appendChild(element);
    element.click();
  };

  const filteredProfiles = Array.isArray(allProfiles)
    ? allProfiles.filter((profile) => {
        const searchTermLower = searchTerm.toLowerCase();

        // 1. Check Name (Safe check using optional chaining)
        const matchesName = (profile.fullName || profile.name)
          ?.toLowerCase()
          .includes(searchTermLower);

        // 2. Check Skills (Safe check to ensure skills is an array)
        const matchesSkills =
          Array.isArray(profile.skills) &&
          profile.skills.some((s) =>
            s.professional_title?.toLowerCase().includes(searchTermLower),
          );

        return matchesName || matchesSkills;
      })
    : []; // Default to empty array if allProfiles isn't loaded yet

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] text-slate-200 py-12 px-4 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto">
        {loading && (
          <div className="max-w-md mx-auto mb-8 bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 animate-pulse">
            <span className="text-xl">📡</span>
            <span className="font-bold">Updating Data...</span>
          </div>
        )}
        <Router>
          <Navbar />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile/:id" element={<ProfileDetail />} />
              <Route
                path="/profiles"
                element={
                  <ProtectedRoute requiredRole="recruiter">
                    <TalentPool />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="mt-8">
        <nav className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => handleModeSwitch("worker")}
            className={`px-8 py-3 rounded-2xl font-black transition-all duration-300 ${activeTab === "worker" ? "bg-blue-600 text-white shadow-xl" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            👷 Worker Mode
          </button>

          {/* 🔒 ONLY render this button if the user exists and their role is 'recruiter' */}
          {user?.role === "recruiter" && (
            <button
              onClick={() => handleModeSwitch("recruiter")}
              className={`px-8 py-3 rounded-2xl font-black transition-all duration-300 ${activeTab === "recruiter" ? "bg-blue-600 text-white shadow-xl" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              🔍 Recruiter Mode
            </button>
          )}
        </nav>

        <header className="text-center mb-16">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 tracking-tight">
            SkillBridge<span className="text-white">AI</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            {activeTab === "worker"
              ? "Bridging the gap between manual experience and professional titles."
              : "Discover verified talent and matched professional skillsets."}
          </p>
        </header>

        {activeTab === "worker" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-slate-800/50">
                <div className="mb-8 border-b border-slate-800 pb-6">
                  <h3 className="font-bold text-white text-xl mb-4">Availability Status</h3>
                  <StatusToggle initialStatus={false} />
                </div>
                <h3 className="font-bold text-white text-xl mb-6">
                  Voice Command
                </h3>
                <button
                  onClick={toggleListen}
                  disabled={loading || error}
                  className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 border-b-4 ${
                    isListening
                      ? "bg-red-500 text-white border-red-700 animate-pulse"
                      : "bg-blue-600 text-white border-blue-800 shadow-xl"
                  }`}
                >
                  {isListening ? "🛑 STOP LISTENING" : "🎤 START RECORDING"}
                </button>

                <div className="mt-8 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                  <h3 className="font-bold text-white text-xl mb-6">
                    Create Profile
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-95"
                    >
                      Save My Profile
                    </button>
                    {saveStatus && (
                      <p className="text-center text-sm font-bold animate-bounce text-emerald-400">
                        {saveStatus}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 min-h-[120px]">
                  <p className="text-slate-400 italic font-medium">
                    {input || "Waiting for voice..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-slate-800/50 min-h-[500px]">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
                  <h2 className="text-3xl font-black text-white">
                    Your Portfolio
                  </h2>
                  {foundSkills.length > 0 && (
                    <button
                      onClick={downloadProfile}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20"
                    >
                      Export
                    </button>
                  )}
                </div>

                {Object.keys(groupedSkills).length > 0 ? (
                  <div className="space-y-10">
                    {Object.entries(groupedSkills).map(([category, skills]) => (
                      <div key={category} className="group transition-all">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-3 group-hover:text-blue-500 transition-colors">
                          <span className="w-8 h-[2px] bg-slate-200 group-hover:bg-blue-500"></span>
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {skills.map((skill) => (
                            <div
                              key={skill.id}
                              className={`px-6 py-4 rounded-2xl border-2 shadow-sm transform transition-all hover:scale-[1.03] ${getCategoryStyle(category)}`}
                            >
                              <span className="font-bold text-base block">
                                {skill.professional_title}
                              </span>
                              <span className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1 block">
                                Verified Match
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-4xl mb-4 animate-bounce">🎤</div>
                    <h3 className="text-slate-800 font-black text-xl mb-2">
                      Ready to discover?
                    </h3>
                    <p className="text-slate-400">
                      Try saying: "I drive a tractor and plant seeds."
                    </p>
                  </div>
                )}
              </div>
              <BookingsDashboard userRole="worker" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <BookingsDashboard userRole="recruiter" />
            <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <h2 className="text-3xl font-black text-white tracking-tight">
                Talent Pool
              </h2>
              <div className="relative w-full md:w-96">
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-white placeholder-slate-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : Array.isArray(allProfiles) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile) => (
                    <div
                      key={profile._id}
                      className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50 hover:border-slate-700 hover:scale-[1.02] transition-all"
                    >
                      <div className="mb-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-2xl font-black text-white">
                            {profile.fullName || profile.name || "Anonymous User"}
                          </h3>
                          {profile.isOnline && (
                            <div className="relative flex items-center justify-center h-5 w-5 mt-1" title="Active Now">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                          )}
                        </div>
                        <p className="text-blue-600 font-bold">
                          {profile.user?.email || profile.contactPhone || profile.phone || "No contact info"}
                        </p>
                        {profile.isOnline && (
                          <button 
                            onClick={() => setSelectedWorkerForBooking(profile)}
                            className="mt-4 w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-transform hover:scale-105"
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills?.map((s, i) => {
                          const isString = typeof s === 'string';
                          const title = isString ? s : s.professional_title;
                          const category = isString ? 'default' : s.category;
                          return (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${getCategoryStyle(category)}`}
                            >
                              {title || "Unknown Skill"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase tracking-widest">
                    No matching workers found
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-amber-50 rounded-[2.5rem] border-2 border-amber-100">
                <p className="text-amber-700 font-bold">
                  Data currently unavailable.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedWorkerForBooking && (
          <BookingModal
            worker={selectedWorkerForBooking}
            onClose={() => setSelectedWorkerForBooking(null)}
            onSubmit={handleBookingSubmit}
          />
        )}
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </ErrorBoundary>
        </Router>
      </div>
    </div>
  );
}
export default App;
