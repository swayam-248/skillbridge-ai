import React, { useState, useEffect } from "react";
import { matchSkills } from "./services/nlpService";
import { createRecognizer } from "./services/voiceService";

// Helper for industry-specific branding (Keeping your existing styles)
const getCategoryStyle = (category) => {
  const normalized = category ? category.toLowerCase().trim() : "default";
  const styles = {
    agriculture:
      "bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100",
    "trade services":
      "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100",
    hospitality:
      "bg-orange-50 text-orange-700 border-orange-200 shadow-sm shadow-orange-100",
    "logistics & transport":
      "bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100",
    "cleaning services":
      "bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-100",
    retail:
      "bg-pink-50 text-pink-700 border-pink-200 shadow-sm shadow-pink-100",
    landscaping:
      "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100",
    default:
      "bg-slate-50 text-slate-700 border-slate-200 shadow-sm shadow-slate-100",
  };
  return styles[normalized] || styles.default;
};

function App() {
  const [input, setInput] = useState("");
  const [foundSkills, setFoundSkills] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);

  // --- DAY 7: DATABASE STATES ---
  const [dbSkills, setDbSkills] = useState([]); // Skills fetched from MongoDB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Skills from MongoDB on Load
  useEffect(() => {
    const fetchSkillsFromDB = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/skills");
        if (!response.ok) throw new Error("Failed to reach server");
        const data = await response.json();
        setDbSkills(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          "Database Connection Failed. Please ensure the server is running.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSkillsFromDB();
  }, []);

  // 2. Initialize Voice Recognizer (Updated to use dbSkills)
  useEffect(() => {
    if (dbSkills.length === 0) return; // Wait until skills are loaded

    const rec = createRecognizer(
      (transcript) => {
        setInput(transcript);
        // PASSING dbSkills to the matcher now
        setFoundSkills(matchSkills(transcript, dbSkills));
      },
      () => setIsListening(false),
    );
    setRecognizer(rec);
  }, [dbSkills]);

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

  const downloadProfile = () => {
    if (foundSkills.length === 0) return;
    const profileText = Object.entries(groupedSkills)
      .map(([category, skills]) => {
        const list = skills.map((s) => `• ${s.professional_title}`).join("\n");
        return `[${category.toUpperCase()}]\n${list}\n`;
      })
      .join("\n");

    const element = document.createElement("a");
    const file = new Blob(
      [
        `SKILLBRIDGE AI - PROFESSIONAL SKILL REPORT\nGenerated: ${new Date().toLocaleDateString()}\n\n${profileText}`,
      ],
      { type: "text/plain" },
    );
    element.href = URL.createObjectURL(file);
    element.download = "SkillBridge_Profile.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* DAY 7: SERVER STATUS INDICATORS */}
        {loading && (
          <div className="max-w-md mx-auto mb-8 bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 animate-pulse">
            <span className="text-xl">📡</span>
            <span className="font-bold">Connecting to SkillBridge DB...</span>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-100 text-red-700 p-4 rounded-2xl border-2 border-red-200 flex items-center justify-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-16">
          <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-4 inline-block shadow-lg shadow-blue-200">
            Phase 2: Database Live
          </span>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
            SkillBridge<span className="text-blue-600">AI</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Bridging the gap between manual experience and professional titles.
            Now powered by a live MongoDB backend.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls - Left Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
              <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
                Voice Command
              </h3>

              <button
                onClick={toggleListen}
                disabled={loading || error} // Disable if DB is not ready
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 border-b-4 ${
                  loading || error
                    ? "bg-slate-300 border-slate-400 cursor-not-allowed text-slate-500"
                    : isListening
                      ? "bg-red-500 text-white border-red-700 animate-pulse scale-[0.98]"
                      : "bg-blue-600 text-white border-blue-800 hover:bg-blue-500 hover:-translate-y-1 shadow-xl shadow-blue-200"
                }`}
              >
                {isListening ? "🛑 STOP LISTENING" : "🎤 START RECORDING"}
              </button>

              <div className="mt-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Live Analysis
                </label>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 min-h-[180px] shadow-inner">
                  <p className="text-slate-600 leading-relaxed font-medium italic">
                    {input ||
                      (loading
                        ? "Initializing..."
                        : "Waiting for your voice...")}
                  </p>
                </div>
              </div>

              {foundSkills.length > 0 && (
                <button
                  onClick={resetProfile}
                  className="w-full mt-4 text-slate-400 text-xs font-bold hover:text-red-500 transition-colors"
                >
                  Clear Results
                </button>
              )}
            </div>
          </div>

          {/* Results - Right Column */}
          <div className="lg:col-span-8">
            <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">
                    Your Portfolio
                  </h2>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-tighter">
                    {foundSkills.length} Skills Identified
                  </p>
                </div>

                {foundSkills.length > 0 && (
                  <button
                    onClick={downloadProfile}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
                  >
                    📥 Export Profile
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
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-4xl animate-bounce">
                    🎤
                  </div>
                  <h3 className="text-slate-800 font-black text-xl mb-2">
                    {loading ? "Loading Database..." : "Ready to discover?"}
                  </h3>
                  <p className="text-slate-400 max-w-xs mx-auto text-center">
                    {error
                      ? "There was an issue connecting. Check your server terminal."
                      : "Try saying: 'I drive a tractor and plant seeds.'"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
