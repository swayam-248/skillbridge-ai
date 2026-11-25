/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { matchSkills } from "./services/nlpService";
import { createRecognizer } from "./services/voiceService";
import Home from "./pages/Home";
import TalentPool from "./pages/TalentPool";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import ProfileDetail from "./pages/ProfileDetails";
import BookingModal from "./components/BookingModal";
import IncomingJobModal from "./components/IncomingJobModal";
import BookingsDashboard from "./components/BookingsDashboard";
import LiveJobTrackerModal from "./components/LiveJobTrackerModal";
import BookingChatModal from "./components/BookingChatModal";
import Sidebar from "./components/Sidebar";
import JobsBoard from "./components/JobsBoard";
import ApplicationsTracker from "./components/ApplicationsTracker";
import Login from "./pages/Login";
import OnboardingView from "./pages/dashboard/OnboardingView";
import WorkerProfileView from "./pages/dashboard/WorkerProfileView";
import VoiceStudioView from "./pages/dashboard/VoiceStudioView";
import RecruiterDashboard from "./pages/dashboard/RecruiterDashboard";
import { API_BASE_URL } from "./utils/api";
import { useSocket } from "./context/SocketContext";

function App() {
  const [input, setInput] = useState("");
  const [foundSkills, setFoundSkills] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [dbSkills, setDbSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userStatus, setUserStatus] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [currentView, setCurrentView] = useState("profile");
  const [allProfiles, setAllProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [problemText, setProblemText] = useState("");
  const [workerHistory, setWorkerHistory] = useState([]);
  const [workerReviews, setWorkerReviews] = useState([]);
  const [workerRating, setWorkerRating] = useState({ avg: 0, count: 0 });
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState(null);
  const [recruiterLocation, setRecruiterLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('skillbridge_user_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [28.6139, 77.2090];
  });
  const [activeTripBooking, setActiveTripBooking] = useState(null);
  const [activeTrackingModal, setActiveTrackingModal] = useState(null);
  const [activeChatModal, setActiveChatModal] = useState(null);

  const handleUpdateRecruiterLocation = (coords) => {
    setRecruiterLocation(coords);
    try {
      localStorage.setItem('skillbridge_user_location', JSON.stringify(coords));
    } catch (e) {
      // ignore
    }
  };

  const { user, login, token: contextToken } = useContext(AuthContext);
  const {
    incomingDispatch,
    setIncomingDispatch,
    workerStatusEvent,
    reviewReceivedEvent,
    lastStatusUpdate,
    newBookingEvent
  } = useSocket() || {};

  // Fetch active bookings on load or user change
  const fetchActiveTripBooking = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token || !user) return;
      const res = await axios.get(`${API_BASE_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        const active = res.data.find(
          (b) => b.status === "accepted" || b.status === "in_progress"
        );
        setActiveTripBooking(active || null);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchActiveTripBooking();
  }, [user]);

  // Synchronize active trip on real-time status changes
  useEffect(() => {
    if (lastStatusUpdate && lastStatusUpdate._id) {
      if (lastStatusUpdate.status === "accepted" || lastStatusUpdate.status === "in_progress") {
        setActiveTripBooking(lastStatusUpdate);
      } else if (lastStatusUpdate.status === "completed" || lastStatusUpdate.status === "cancelled") {
        setActiveTripBooking((prev) => (prev?._id === lastStatusUpdate._id ? null : prev));
        setActiveTrackingModal((prev) => (prev?._id === lastStatusUpdate._id ? null : prev));
        setActiveChatModal((prev) => (prev?._id === lastStatusUpdate._id ? null : prev));
      }
    }
  }, [lastStatusUpdate]);

  // Synchronize on new booking event
  useEffect(() => {
    if (newBookingEvent && (newBookingEvent.status === "accepted" || newBookingEvent.status === "in_progress")) {
      setActiveTripBooking(newBookingEvent);
    }
  }, [newBookingEvent]);

  // Real-time synchronization: When any worker goes Online / Offline, update talent pool & map immediately
  useEffect(() => {
    if (workerStatusEvent && workerStatusEvent.userId) {
      setAllProfiles((prev) =>
        prev.map((p) => {
          const profUserId = p.user?._id || p.user || p._id;
          if (String(profUserId) === String(workerStatusEvent.userId)) {
            return {
              ...p,
              isOnline: workerStatusEvent.isOnline,
              location: workerStatusEvent.profile?.location || p.location
            };
          }
          return p;
        })
      );
    }
  }, [workerStatusEvent]);

  // Real-time synchronization: When a worker receives a review, update rating live without refreshing
  useEffect(() => {
    if (reviewReceivedEvent && user?.role === "worker") {
      setWorkerRating({
        avg: String(reviewReceivedEvent.newRating || "5.0"),
        count: reviewReceivedEvent.reviewCount || 1
      });
      setWorkerReviews((prev) => [
        {
          _id: Math.random().toString(),
          rating: reviewReceivedEvent.rating,
          comment: reviewReceivedEvent.comment,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }
  }, [reviewReceivedEvent, user?.role]);

  // Set initial view based on role
  useEffect(() => {
    if (user?.role === "recruiter") {
      if (currentView === "profile" || currentView === "voice") {
        setCurrentView("talent");
      }
    } else if (user?.role === "worker") {
      if (currentView === "talent") {
        setCurrentView("profile");
      }
    }
  }, [user?.role]);

  // Fetch NLP database skills
  useEffect(() => {
    const fetchSkillsFromDB = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/skills`);
        if (!response.ok) throw new Error("Failed to reach server");
        const data = await response.json();
        setDbSkills(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Database skills failed to load:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkillsFromDB();
  }, []);

  // Voice Recognizer setup
  useEffect(() => {
    const rec = createRecognizer(
      (transcript) => {
        if (user?.role === "worker") {
          setInput(transcript);
          if (dbSkills.length > 0) {
            setFoundSkills((prev) => {
              const newSkills = matchSkills(transcript, dbSkills);
              const existingTitles = new Set(
                prev.map((s) => (typeof s === "string" ? s : s.professional_title))
              );
              const uniqueNew = newSkills.filter(
                (s) => !existingTitles.has(s.professional_title)
              );
              return [...prev, ...uniqueNew];
            });
          }
        } else {
          setProblemText(transcript);
        }
      },
      () => setIsListening(false),
      (err) => {
        setIsListening(false);
        console.error("Voice Error:", err);
        if (err === "not-allowed") {
          alert("Microphone access was denied. Please allow microphone permissions in your browser.");
        }
      }
    );
    setRecognizer(rec);
  }, [dbSkills, user]);

  // Recruiter Profiles Fetching
  const fetchAllProfiles = async (skill = "") => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const url = skill
        ? `${API_BASE_URL}/api/profiles?skill=${encodeURIComponent(skill)}`
        : `${API_BASE_URL}/api/profiles`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setAllProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading profiles:", err);
      setAllProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "recruiter" && currentView === "talent") {
      const timer = setTimeout(() => {
        if (problemText.length > 4) {
          const matched = matchSkills(problemText, dbSkills);
          fetchAllProfiles(matched[0]?.professional_title || searchTerm);
        } else {
          fetchAllProfiles(searchTerm);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, problemText, currentView, user, dbSkills]);

  // Check Profile Completion & Load User Data
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data = await response.json();

        // Sanitized Name (Remove stray symbols if present)
        const cleanName = data.fullName
          ? data.fullName.replace(/[^\w\s]/gi, "").trim()
          : "";

        setUserName(cleanName);
        setUserPhone(data.contactPhone || "");
        setUserBio(data.bio || "");
        setUserStatus(Boolean(data.isOnline));
        setWorkerHistory(data.workHistory || []);
        setWorkerReviews(data.reviews || []);
        setWorkerRating({
          avg: data.averageRating || "0.0",
          count: data.reviewCount || 0,
        });

        if (Array.isArray(data.skills)) {
          setFoundSkills(
            data.skills.map((skill) =>
              typeof skill === "string"
                ? { professional_title: skill, category: "Trade Services" }
                : skill
            )
          );
        }

        // Onboarding Check
        if (data.isComplete === false && user?.role === "worker") {
          setCurrentView("onboarding");
        }
      } catch (err) {
        console.error("Profile check failed:", err);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user?.email]);

  const handleBookingSubmit = async (workerId, jobDescription, serviceAddress, totalAmount, location) => {
    try {
      const token = sessionStorage.getItem("token");
      const locPayload = location || (recruiterLocation && recruiterLocation.length === 2
        ? { type: 'Point', coordinates: [recruiterLocation[1], recruiterLocation[0]] } // [lng, lat]
        : undefined);

      await axios.post(
        `${API_BASE_URL}/api/bookings`,
        {
          workerId,
          jobDescription,
          serviceAddress,
          totalAmount,
          location: locPayload
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("⚡ Booking dispatched! Worker has been alerted in real time with a 30s countdown.");
      setSelectedWorkerForBooking(null);
      setCurrentView("bookings");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error sending booking request.");
    }
  };

  const handleSaveProfile = async (event) => {
    if (event) event.preventDefault();
    const isWorker = user?.role === "worker";

    if (!userName.trim() || !userPhone.trim()) {
      alert("Please provide your name and contact phone number.");
      return;
    }

    if (isWorker && foundSkills.length === 0) {
      alert("Please add at least one professional skill to your profile.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Please log in to save your profile.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userName.trim(),
          phone: userPhone.trim(),
          bio: userBio.trim(),
          skills: foundSkills,
        }),
      });

      if (response.ok) {
        const savedProfile = await response.json();
        setSaveStatus("Profile saved successfully!");
        login(token || contextToken, {
          ...user,
          fullName: savedProfile.fullName,
          contactPhone: savedProfile.contactPhone,
          bio: savedProfile.bio,
          skills: savedProfile.skills,
          isOnline: savedProfile.isOnline,
          isComplete: true,
        });

        setTimeout(() => {
          setSaveStatus("");
          if (currentView === "onboarding") {
            setCurrentView(user?.role === "worker" ? "profile" : "talent");
          }
        }, 1200);
      } else {
        const errData = await response.json();
        setSaveStatus(`Error: ${errData.message || "Failed to save profile."}`);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("Network error saving profile.");
    }
  };

  const toggleListen = () => {
    if (!recognizer) {
      alert("Speech recognition is not available in this browser. Please use Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognizer.stop();
      setIsListening(false);
    } else {
      if (user?.role === "worker") {
        setInput("");
      } else {
        setProblemText("");
      }
      recognizer.start();
      setIsListening(true);
    }
  };

  const groupedSkills = (Array.isArray(foundSkills) ? foundSkills : []).reduce((acc, skill) => {
    if (!skill) return acc;
    const category =
      (typeof skill === "object" && skill.category ? skill.category : null) || "Trade Services";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  const downloadProfile = () => {
    if (!Array.isArray(foundSkills) || foundSkills.length === 0) return;
    const profileText = Object.entries(groupedSkills || {})
      .map(
        ([category, skills]) =>
          `[${category.toUpperCase()}]\n${(Array.isArray(skills) ? skills : [])
            .map((s) => `- ${typeof s === "string" ? s : s?.professional_title || "Skill"}`)
            .join("\n")}\n`
      )
      .join("\n");

    const resumeContent = `====================================
SKILLBRIDGE AI — VERIFIED WORKER PROFILE
====================================
Name: ${userName || "Professional Worker"}
Contact: ${userPhone || "N/A"}
Email: ${user?.email || "N/A"}
Average Rating: ${workerRating?.avg || "0.0"} / 5.0 (${workerRating?.count || 0} reviews)
Completed Jobs: ${(Array.isArray(workerHistory) ? workerHistory : []).length}

BIO & SUMMARY:
${userBio || "Experienced trade and practical labor professional."}

VERIFIED SKILLS:
${profileText}
Generated via SkillBridge AI Marketplace
`;

    const element = document.createElement("a");
    const file = new Blob([resumeContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${(userName || "profile").replace(/\s+/g, "_")}_SkillBridge_Profile.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredProfiles = Array.isArray(allProfiles)
    ? allProfiles.filter((profile) => {
        if (!profile) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        const matchesName = (
          profile.fullName ||
          profile.name ||
          profile.user?.email ||
          ""
        )
          .toLowerCase()
          .includes(q);
        const matchesSkills =
          Array.isArray(profile.skills) &&
          profile.skills.some((skill) => {
            if (!skill) return false;
            const title =
              typeof skill === "string" ? skill : skill.professional_title || skill.title || "";
            return title.toLowerCase().includes(q);
          });
        return matchesName || matchesSkills;
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {loading && <LoadingSpinner label="Connecting to SkillBridge AI Engine..." />}
      <Router>
        <ErrorBoundary>
          <Routes>
            {/* Landing Page at Root / */}
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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen bg-slate-50 text-slate-900">
                    {currentView !== "onboarding" && (
                      <Sidebar
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                      />
                    )}

                    <main
                      className={`min-w-0 flex-1 ${
                        currentView === "onboarding"
                          ? ""
                          : "overflow-y-auto p-5 pb-28 md:p-8 md:pb-12"
                      }`}
                    >
                      {currentView === "onboarding" ? (
                        <OnboardingView
                          user={user}
                          userName={userName}
                          setUserName={setUserName}
                          userPhone={userPhone}
                          setUserPhone={setUserPhone}
                          isListening={isListening}
                          toggleListen={toggleListen}
                          input={input}
                          foundSkills={foundSkills}
                          setFoundSkills={setFoundSkills}
                          dbSkills={dbSkills}
                          handleSaveProfile={handleSaveProfile}
                          saveStatus={saveStatus}
                        />
                      ) : user?.role === "worker" ? (
                        <>
                          {currentView === "profile" && (
                            <WorkerProfileView
                              userStatus={userStatus}
                              onStatusChange={setUserStatus}
                              userName={userName}
                              setUserName={setUserName}
                              userPhone={userPhone}
                              setUserPhone={setUserPhone}
                              userBio={userBio}
                              setUserBio={setUserBio}
                              handleSaveProfile={handleSaveProfile}
                              saveStatus={saveStatus}
                              foundSkills={foundSkills}
                              setFoundSkills={setFoundSkills}
                              groupedSkills={groupedSkills}
                              downloadProfile={downloadProfile}
                              workerRating={workerRating}
                              workerHistory={workerHistory}
                              workerReviews={workerReviews}
                              userEmail={user?.email}
                              switchToVoiceStudio={() => setCurrentView("voice")}
                              dbSkills={dbSkills}
                            />
                          )}
                          {currentView === "voice" && (
                            <VoiceStudioView
                              isListening={isListening}
                              toggleListen={toggleListen}
                              input={input}
                              foundSkills={foundSkills}
                              setFoundSkills={setFoundSkills}
                              handleSaveProfile={handleSaveProfile}
                              saveStatus={saveStatus}
                              dbSkills={dbSkills}
                            />
                          )}
                          {currentView === "jobs" && <JobsBoard userRole="worker" />}
                          {currentView === "applications" && (
                            <ApplicationsTracker userRole="worker" />
                          )}
                          {currentView === "bookings" && (
                            <BookingsDashboard userRole="worker" />
                          )}
                        </>
                      ) : (
                        <>
                          {currentView === "talent" && (
                            <RecruiterDashboard
                              isListening={isListening}
                              toggleListen={toggleListen}
                              problemText={problemText}
                              setProblemText={setProblemText}
                              searchTerm={searchTerm}
                              setSearchTerm={setSearchTerm}
                              filteredProfiles={filteredProfiles}
                              loading={loading}
                              allProfiles={allProfiles}
                              setSelectedWorkerForBooking={setSelectedWorkerForBooking}
                              userLocation={recruiterLocation}
                              setUserLocation={handleUpdateRecruiterLocation}
                            />
                          )}
                          {currentView === "jobs" && <JobsBoard userRole="recruiter" />}
                          {currentView === "applications" && (
                            <ApplicationsTracker userRole="recruiter" />
                          )}
                          {currentView === "bookings" && (
                            <BookingsDashboard userRole="recruiter" />
                          )}
                        </>
                      )}

                      {selectedWorkerForBooking && (
                        <BookingModal
                          worker={selectedWorkerForBooking}
                          onClose={() => setSelectedWorkerForBooking(null)}
                          onSubmit={handleBookingSubmit}
                          initialDescription={problemText}
                          userLocation={recruiterLocation}
                        />
                      )}

                      {incomingDispatch && (
                        <IncomingJobModal
                          dispatchData={incomingDispatch}
                          onClose={() => setIncomingDispatch && setIncomingDispatch(null)}
                          onAccepted={(acceptedBooking) => {
                            setCurrentView("bookings");
                            if (acceptedBooking) {
                              setActiveTripBooking(acceptedBooking);
                              setActiveTrackingModal(acceptedBooking);
                            }
                          }}
                        />
                      )}

                      {/* Uber-Style Persistent Active Trip Floating HUD */}
                      {activeTripBooking && (
                        <aside aria-label="Active Trip Status" className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 z-40 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl border border-blue-500/30 bg-slate-900/95 p-3.5 sm:px-6 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
                          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-xl shadow-md shadow-blue-500/30">
                              {user?.role === "worker" ? "🧭" : "🚙"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                                  {user?.role === "worker" ? "Active Job En Route" : "Specialist En Route"}
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Live Trip
                                </span>
                                {activeTripBooking.status === "in_progress" && (
                                  <span className="badge badge-indigo text-[9px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                    🛠️ Work In Progress
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-white truncate max-w-sm mt-0.5">
                                {user?.role === "worker"
                                  ? `📍 Destination: ${activeTripBooking.serviceAddress || "Customer Doorstep"}`
                                  : activeTripBooking.jobDescription}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                            {user?.role === "recruiter" && activeTripBooking.status === "accepted" && (
                              <div className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 border border-slate-700 text-xs">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">OTP:</span>
                                <span className="font-mono font-black text-blue-400 tracking-wider">
                                  {activeTripBooking.startOtp || "4821"}
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveTrackingModal(activeTripBooking)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:from-blue-700 hover:to-indigo-800 transition shadow-sm shadow-blue-500/25"
                            >
                              <span>{user?.role === "worker" ? "🧭 Driver Navigation Map" : "🗺️ Track Pro Live"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveChatModal(activeTripBooking)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition"
                            >
                              <span>💬 Chat</span>
                            </button>
                          </div>
                        </aside>
                      )}

                      {/* Live GPS Tracker / Driver Navigation Modal */}
                      {activeTrackingModal && (
                        <LiveJobTrackerModal
                          booking={activeTrackingModal}
                          currentUserRole={user?.role}
                          onClose={() => setActiveTrackingModal(null)}
                          onStartJobWithOtp={async (bookingId, otpCode) => {
                            try {
                              const token = sessionStorage.getItem("token");
                              const res = await axios.put(
                                `${API_BASE_URL}/api/bookings/${bookingId}/status`,
                                { status: "in_progress", otp: otpCode },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              setActiveTripBooking(res.data);
                              return { success: true };
                            } catch (err) {
                              return {
                                success: false,
                                message: err.response?.data?.message || "Invalid OTP code",
                              };
                            }
                          }}
                          onCompleteJob={async (bookingId) => {
                            try {
                              const token = sessionStorage.getItem("token");
                              await axios.put(
                                `${API_BASE_URL}/api/bookings/${bookingId}/status`,
                                { status: "completed" },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              setActiveTrackingModal(null);
                              setActiveTripBooking(null);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        />
                      )}

                      {/* Real-time In-App Live Chat Modal */}
                      {activeChatModal && (
                        <BookingChatModal
                          booking={activeChatModal}
                          currentUser={{ role: user?.role }}
                          onClose={() => setActiveChatModal(null)}
                        />
                      )}
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Router>
    </div>
  );
}

export default App;
