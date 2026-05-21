import React, { useState, useEffect, useContext } from "react";
import { matchSkills } from "./services/nlpService";
import { createRecognizer } from "./services/voiceService";
import Soundwave from "./components/Soundwave";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import TalentPool from "./pages/TalentPool";
import LoadingSpinner from "./components/LoadingSpinner";
import { SkeletonGrid } from "./components/SkeletonCard";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import ProfileDetail from "./pages/ProfileDetails";
import axios from "axios";
import StatusToggle from "./components/StatusToggle";
import BookingModal from "./components/BookingModal";
import BookingsDashboard from "./components/BookingsDashboard";
import Sidebar from "./components/Sidebar";
import JobsBoard from "./components/JobsBoard";
import ApplicationsTracker from "./components/ApplicationsTracker";
import { API_BASE_URL } from "./utils/api";


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
  const [userStatus, setUserStatus] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const { user, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("worker");
  const [currentView, setCurrentView] = useState("jobs");
  const [allProfiles, setAllProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [problemText, setProblemText] = useState("");
  const [workerHistory, setWorkerHistory] = useState([]);
  const [workerReviews, setWorkerReviews] = useState([]);
  const [workerRating, setWorkerRating] = useState({ avg: 0, count: 0 });
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
    const rec = createRecognizer(
      (transcript) => {
        if (user?.role === 'worker') {
          setInput(transcript);
          if (dbSkills.length > 0) {
            setFoundSkills(prev => {
              const newSkills = matchSkills(transcript, dbSkills);
              const existingTitles = new Set(prev.map(s => s.professional_title));
              const uniqueNewSkills = newSkills.filter(s => !existingTitles.has(s.professional_title));
              return [...prev, ...uniqueNewSkills];
            });
          }
        } else {
          setProblemText(transcript);
        }
      },
      () => setIsListening(false), // Handle onEnd
      (err) => {
        setIsListening(false);
        console.error("Voice Error:", err);
        if (err === 'not-allowed') {
          alert("🎤 Microphone access denied. Please enable it in your browser settings.");
        } else if (err !== 'no-speech') {
          alert("🎤 Voice recognition error: " + err);
        }
      },
    );
    setRecognizer(rec);
  }, [dbSkills, user]); // Added user to dependencies to prevent stale closures

  const fetchAllProfiles = async (skill = "") => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const url = skill 
        ? `${API_BASE_URL}/api/profiles?skill=${encodeURIComponent(skill)}`
        : `${API_BASE_URL}/api/profiles`;
        
      const response = await fetch(url, {
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

  // Trigger search when search term changes
  useEffect(() => {
    if (user?.role === 'recruiter' && currentView === 'talent') {
      const delayDebounceFn = setTimeout(() => {
        // If there's problem text, we use the NLP service to find skills, 
        // otherwise we just use the search term directly
        if (problemText.length > 5) {
          const matched = matchSkills(problemText, dbSkills);
          if (matched.length > 0) {
            // Join matched skills to search for them
            fetchAllProfiles(matched[0].professional_title);
          } else {
            fetchAllProfiles(searchTerm);
          }
        } else {
          fetchAllProfiles(searchTerm);
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, problemText, currentView, user, dbSkills]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.isComplete === false && currentView !== "profile" && currentView !== "talent") {
            setCurrentView("onboarding");
          } else if (data.isComplete === true) {
            setUserName(data.fullName || "");
            setUserPhone(data.contactPhone || "");
            setUserStatus(data.isOnline || false);
            setWorkerHistory(data.workHistory || []);
            setWorkerReviews(data.reviews || []);
            setWorkerRating({ avg: data.averageRating || 0, count: data.reviewCount || 0 });
            if (data.skills && Array.isArray(data.skills)) {
              setFoundSkills(data.skills.map(s => typeof s === 'string' ? { professional_title: s, category: "default" } : s));
            }
            // Only switch view if we aren't already on a dashboard view
            if (currentView === "jobs" || currentView === "onboarding") {
              setCurrentView(user?.role === "worker" ? "profile" : "talent");
            }
          }
        }
      } catch (err) {
        console.error("Profile check failed:", err);
      }
    };

    if (user) {
      setActiveTab(user.role);
      // If we already know the profile is complete from login, populate data and skip to dashboard
      if (user.isComplete) {
        setUserName(user.fullName || "");
        setUserPhone(user.contactPhone || "");
        setUserStatus(user.isOnline || false);
        setWorkerRating({ avg: user.averageRating || 0, count: user.reviewCount || 0 });
        if (user.skills && Array.isArray(user.skills)) {
          setFoundSkills(user.skills.map(s => typeof s === 'string' ? { professional_title: s, category: "default" } : s));
        }
        setCurrentView(user.role === "worker" ? "profile" : "talent");
        // Still call checkProfile in background to get full history/reviews
        checkProfile();
      } else {
        checkProfile();
      }
    }
  }, [user]);

  const handleModeSwitch = (mode) => {
    // Deprecated: UI is now strictly mapped to user.role.
  };

  const handleBookingSubmit = async (workerId, jobDescription) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/bookings`,
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

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const isWorker = user?.role === 'worker';
    if (!userName || !userPhone || (isWorker && foundSkills.length === 0)) {
      alert(isWorker ? "Please enter details and identify some skills first!" : "Please enter your name and phone number!");
      return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Please log in to save your profile!");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles`, {
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
        setTimeout(() => {
          setSaveStatus("");
          setCurrentView(user.role === "worker" ? "profile" : "talent");
        }, 1500);
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
    if (!recognizer) {
      alert("Speech recognition is not available in this browser. Please try Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognizer.stop();
      setIsListening(false);
    } else {
      // Clear current inputs before starting new voice session
      if (user?.role === 'worker') {
        setInput("");
        setFoundSkills([]);
      } else {
        setProblemText("");
      }
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
      const token = sessionStorage.getItem("token");

      // 2. We call the NEW backend route with the search term as a "Query Parameter"
      const res = await axios.get(
        `${API_BASE_URL}/api/profiles?skill=${term}`,
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
        if (!searchTerm) return true; // Show everyone if no search term

        const searchTermLower = searchTerm.toLowerCase();

        // 1. Check Name or Email
        const matchesName = (profile.fullName || profile.name || profile.user?.email)
          ?.toLowerCase()
          .includes(searchTermLower);

        // 2. Check Skills
        const matchesSkills =
          Array.isArray(profile.skills) &&
          profile.skills.some((s) => {
            const title = typeof s === 'string' ? s : (s.professional_title || s.title);
            return title?.toLowerCase().includes(searchTermLower);
          });

        return matchesName || matchesSkills;
      })
    : [];

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="w-full">
        {loading && (
          <div className="max-w-md mx-auto mb-8 bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 animate-pulse">
            <span className="text-xl">📡</span>
            <span className="font-bold">Updating Data...</span>
          </div>
        )}
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
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
                  <div className="flex h-screen overflow-hidden bg-slate-950">
                    {/* Hide sidebar during onboarding */}
                    {currentView !== "onboarding" && (
                      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
                    )}

                    {/* Main Content */}
                    <main className={`flex-1 overflow-y-auto ${currentView === "onboarding" ? "p-0" : "p-10"} bg-black/10`}>
                      {currentView === "onboarding" ? (
                        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
                          <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[3rem] border border-slate-800/50 shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="text-center mb-10">
                              <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">Welcome to SkillBridge</h1>
                              <p className="text-slate-400 text-lg font-medium">Let's get your profile ready to start {user?.role === 'worker' ? 'earning' : 'hiring'}.</p>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full p-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                  <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">+91</span>
                                    <input
                                      type="tel"
                                      required
                                      value={userPhone.startsWith('+91') ? userPhone.slice(3) : userPhone}
                                      onChange={(e) => setUserPhone('+91' + e.target.value.replace(/\D/g, ''))}
                                      placeholder="98765 43210"
                                      className="w-full p-5 pl-14 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                                    />
                                  </div>
                                </div>
                              </div>

                              {user?.role === 'worker' && (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Your Skills (Voice Powered)</label>
                                      <Soundwave isListening={isListening} />
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={toggleListen}
                                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}
                                    >
                                      {isListening ? '🛑 Stop' : '🎤 Use Voice'}
                                    </button>
                                  </div>
                                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 min-h-[100px]">
                                    {input && (
                                      <p className="text-blue-400/60 text-xs mb-4 italic animate-pulse font-medium">
                                        " {input} "
                                      </p>
                                    )}
                                    {foundSkills.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {foundSkills.map((s, i) => (
                                          <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-black uppercase">
                                            {s.professional_title}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-slate-600 italic text-sm">{isListening ? "Listening for skills..." : 'Tell us: "I am a professional electrician and plumber..."'}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <button
                                type="submit"
                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-3xl font-black text-xl shadow-2xl shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95"
                              >
                                COMPLETE PROFILE & START
                              </button>
                              
                              {saveStatus && (
                                <p className="text-center font-bold text-emerald-400 animate-bounce">{saveStatus}</p>
                              )}
                            </form>
                          </div>
                        </div>
                      ) : (
                        user?.role === "worker" ? (
                        <>
                          {currentView === "profile" && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="lg:col-span-4 space-y-6">
                                <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-slate-800/50">
                                  <div className="mb-8 border-b border-slate-800 pb-6">
                                    <h3 className="font-bold text-white text-xl mb-4">Availability Status</h3>
                                    <StatusToggle initialStatus={userStatus} />
                                  </div>
                                  <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white text-xl">Voice Command</h3>
                                    <Soundwave isListening={isListening} />
                                  </div>
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
                                    <h3 className="font-bold text-white text-xl mb-6">Create Profile</h3>
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
                                    <h2 className="text-3xl font-black text-white">Your Portfolio</h2>
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
                                                <span className="font-bold text-base block">{skill.professional_title}</span>
                                                <span className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1 block">Verified Match</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                      <div className="text-4xl mb-4 animate-bounce">🎤</div>
                                      <h3 className="text-slate-800 font-black text-xl mb-2">Ready to discover?</h3>
                                      <p className="text-slate-400">Try saying: "I drive a tractor and plant seeds."</p>
                                    </div>
                                  )}

                                  {/* WORK HISTORY & REVIEWS SECTION */}
                                  <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                    {/* Statistics Card */}
                                    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50">
                                      <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <span className="text-blue-500 text-2xl">📊</span> Stats & Reputation
                                      </h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 text-center">
                                          <p className="text-3xl font-black text-blue-400 mb-1">{workerRating.avg}</p>
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Rating</p>
                                        </div>
                                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 text-center">
                                          <p className="text-3xl font-black text-emerald-400 mb-1">{workerRating.count}</p>
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reviews</p>
                                        </div>
                                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 text-center col-span-2">
                                          <p className="text-3xl font-black text-white mb-1">{workerHistory.length}</p>
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jobs Completed</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Work History List */}
                                    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50">
                                      <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <span className="text-emerald-500 text-2xl">📜</span> Work History
                                      </h3>
                                      {workerHistory.length > 0 ? (
                                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                          {workerHistory.map((job) => (
                                            <div key={job._id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                              <p className="text-white font-bold text-sm mb-1">{job.jobDescription}</p>
                                              <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                <span>Client: {job.recruiter?.email?.split('@')[0]}</span>
                                                <span>{new Date(job.completedAt).toLocaleDateString()}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-slate-500 italic text-center py-10">No completed works yet.</p>
                                      )}
                                    </div>

                                    {/* Recent Reviews */}
                                    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 md:col-span-2">
                                      <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <span className="text-yellow-500 text-2xl">⭐</span> Recent Feedback
                                      </h3>
                                      {workerReviews.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {workerReviews.map((review) => (
                                            <div key={review._id} className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                                              <div className="flex text-yellow-400 mb-3">
                                                {[...Array(5)].map((_, i) => (
                                                  <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                                                ))}
                                              </div>
                                              <p className="text-slate-300 italic mb-4 font-medium">"{review.comment}"</p>
                                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                — Client Feedback on {new Date(review.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-slate-500 italic text-center py-10">Waiting for first review...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {currentView === "bookings" && <BookingsDashboard userRole="worker" />}
                        </>
                      ) : (
                        <>
                          {currentView === "talent" && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                              <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50 flex flex-col gap-6">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-black text-white tracking-tight">Describe Your Problem</h2>
                                    <Soundwave isListening={isListening} />
                                  </div>
                                  <button 
                                    onClick={toggleListen}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}
                                  >
                                    {isListening ? '🛑 Stop' : '🎤 Use Voice'}
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  <textarea
                                    placeholder="e.g., 'My kitchen sink is leaking and I need someone to fix it today'..."
                                    className="w-full p-6 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-white placeholder-slate-500 transition-all min-h-[120px]"
                                    value={problemText}
                                    onChange={(e) => setProblemText(e.target.value)}
                                  />
                                  <div className="flex items-center gap-4">
                                    <div className="h-[1px] flex-1 bg-slate-800"></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">OR SEARCH BY NAME</span>
                                    <div className="h-[1px] flex-1 bg-slate-800"></div>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Search by worker name..."
                                    className="w-full p-4 bg-slate-950/30 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-white placeholder-slate-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Experts Matched for your problem</h3>
                                <span className="text-xs text-slate-500 font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                                  {filteredProfiles.length} EXPERTS FOUND
                                </span>
                              </div>

                              {loading ? (
                                <SkeletonGrid count={3} />
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
                                            <div className="flex items-center gap-1 mt-1">
                                              <span className="text-yellow-400 text-lg">★</span>
                                              <span className="text-white font-black text-sm">{profile.averageRating || "0.0"}</span>
                                              <span className="text-slate-500 text-[10px] font-bold">({profile.reviewCount || 0} reviews)</span>
                                            </div>
                                            {profile.isOnline && (
                                              <div className="relative flex items-center justify-center h-5 w-5 mt-1" title="Active Now">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                              </div>
                                            )}
                                          </div>
                                          <p className="text-blue-600 font-bold">{profile.user?.email || profile.contactPhone || "No contact info"}</p>
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
                                              <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${getCategoryStyle(category)}`}>
                                                {title || "Unknown Skill"}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No matching workers found</div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-12 text-center bg-amber-50 rounded-[2.5rem] border-2 border-amber-100">
                                  <p className="text-amber-700 font-bold">Data currently unavailable.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {currentView === "bookings" && <BookingsDashboard userRole="recruiter" />}
                        </>
                      ))}

                      {selectedWorkerForBooking && (
                        <BookingModal
                          worker={selectedWorkerForBooking}
                          onClose={() => setSelectedWorkerForBooking(null)}
                          onSubmit={handleBookingSubmit}
                          initialDescription={problemText}
                        />
                      )}
                    </main>
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
