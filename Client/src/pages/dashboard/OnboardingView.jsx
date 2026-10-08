import React, { useState } from "react";
import Soundwave from "../../components/Soundwave";
import { matchSkills } from "../../services/nlpService";

export default function OnboardingView({
  user,
  userName,
  setUserName,
  userPhone,
  setUserPhone,
  isListening,
  toggleListen,
  input,
  foundSkills,
  setFoundSkills,
  dbSkills = [],
  handleSaveProfile,
  saveStatus,
}) {
  const [typedInput, setTypedInput] = useState("");

  const handleManualExtract = () => {
    if (!typedInput.trim() || !dbSkills.length) return;
    const newMatched = matchSkills(typedInput, dbSkills);
    if (newMatched.length > 0 && setFoundSkills) {
      setFoundSkills((prev) => {
        const existingTitles = new Set(
          prev.map((s) => (typeof s === "string" ? s : s.professional_title))
        );
        const unique = newMatched.filter(
          (s) => !existingTitles.has(s.professional_title)
        );
        return [...prev, ...unique];
      });
      setTypedInput("");
    }
  };

  const handleRemoveSkill = (indexToRemove) => {
    if (setFoundSkills) {
      setFoundSkills((prev) => prev.filter((_, i) => i !== indexToRemove));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-2xl bg-white p-10 md:p-12 rounded-3xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <span className="badge badge-blue">Quick Account Setup</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Welcome to SkillBridge AI
          </h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            Let's get your profile ready to start {user?.role === 'worker' ? 'earning' : 'hiring'}.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={userPhone.startsWith('+91') ? userPhone.slice(3) : userPhone}
                  onChange={(e) => setUserPhone('+91' + e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="glass-input pl-12"
                />
              </div>
            </div>
          </div>

          {user?.role === 'worker' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                    Your Skills (Voice or Text)
                  </label>
                  <Soundwave isListening={isListening} />
                </div>
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'btn-secondary text-blue-700 bg-blue-50 border-blue-200'
                  }`}
                >
                  {isListening ? '🛑 Stop Recording' : '🎤 Speak Skills'}
                </button>
              </div>

              {/* Manual Text Input Fallback */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleManualExtract();
                    }
                  }}
                  placeholder="Or type experience (e.g. 'I clean bathrooms, mop floors' or 'I do plumbing')..."
                  className="glass-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleManualExtract}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Extract Skills →
                </button>
              </div>

              {/* Extracted Skills Badges */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 min-h-[90px]">
                {input && (
                  <p className="text-blue-800 text-xs mb-3 italic font-semibold">"{input}"</p>
                )}
                {foundSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {foundSkills.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold"
                      >
                        <span>✓ {typeof s === 'string' ? s : s.professional_title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(i)}
                          className="text-blue-400 hover:text-rose-600 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">
                    {isListening
                      ? "Listening for skills..."
                      : 'Speak or type your daily work above (e.g., "I clean bathrooms, mop floors").'}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3.5 text-base shadow-md"
          >
            Complete Profile & Access Dashboard →
          </button>

          {saveStatus && (
            <p className="text-center font-bold text-emerald-600 text-sm">
              {saveStatus}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

