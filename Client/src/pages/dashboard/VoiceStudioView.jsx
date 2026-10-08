import React from "react";
import Soundwave from "../../components/Soundwave";
import { getCategoryStyle } from "../../utils/categoryStyles";

const VoiceStudioView = ({
  isListening,
  toggleListen,
  input,
  foundSkills,
  setFoundSkills,
  handleSaveProfile,
  saveStatus,
  dbSkills = [],
}) => {
  const samplePrompts = [
    "I fix bathroom leaks, replace water valves, and unclog kitchen sinks.",
    "I have 6 years experience doing residential electrical wiring and installing ceiling fans.",
    "I do wall putty, interior wall painting, polishing, and exterior waterproofing.",
    "I repair air conditioners, clean cooling filters, and refill refrigerant gas.",
  ];

  const handleRemoveSkill = (indexToRemove) => {
    setFoundSkills((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2">
          <span className="badge badge-blue">AI-Powered Skill Recognition</span>
          <span className="badge badge-emerald">Compromise NLP Engine</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-2">
          AI Voice Skill Studio
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Speak naturally about your practical labor experience. Our AI identifies and standardizes your skills into professional titles in real time.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Recording Console */}
        <div className="space-y-6">
          <div className="glass-card p-8 relative overflow-hidden bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Voice Capture Station</h2>
                  <p className="text-xs text-slate-500">Microphone stream with live stem extraction</p>
                </div>
              </div>
              <Soundwave isListening={isListening} />
            </div>

            {/* Recording Controls */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center">
              <button
                type="button"
                onClick={toggleListen}
                className={`relative inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 font-display text-base font-extrabold transition-all duration-300 shadow-lg ${
                  isListening
                    ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-500/25 animate-pulse scale-105"
                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02]"
                }`}
              >
                {isListening ? (
                  <>
                    <span className="h-3 w-3 rounded-full bg-white animate-ping" />
                    Stop Recording & Process
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Start AI Voice Registration
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 mt-3 font-medium">
                {isListening
                  ? "🎙️ Listening... Speak about what kind of work you do."
                  : "Tap to begin speaking in English or simple trade terms."}
              </p>
            </div>

            {/* Live Transcript Stream */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Live Speech Transcript
              </label>
              <div className="min-h-24 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 font-medium shadow-2xs">
                {input ? (
                  <p className="italic text-blue-900 font-semibold">"{input}"</p>
                ) : (
                  <p className="text-slate-400 italic">
                    Transcript will appear here in real time as you speak...
                  </p>
                )}
              </div>
            </div>

            {/* Extracted Skills Preview */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  AI-Identified Professional Skills ({foundSkills.length})
                </label>
                {foundSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFoundSkills([])}
                    className="text-xs text-slate-500 hover:text-rose-600 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {foundSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  {foundSkills.map((skill, index) => {
                    const title =
                      typeof skill === "string" ? skill : skill.professional_title;
                    const cat = typeof skill === "object" ? skill.category : "default";

                    return (
                      <span
                        key={`${title}-${index}`}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${getCategoryStyle(
                          cat
                        )}`}
                      >
                        <span>✓</span>
                        <span>{title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="hover:text-rose-600 transition font-black ml-1 text-slate-400"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  No skills identified yet. Speak above or try one of the example prompts.
                </div>
              )}
            </div>

            {/* Save to Profile Button */}
            {foundSkills.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="btn-primary w-full text-sm"
                >
                  💾 Save {foundSkills.length} Identified Skills to My Profile
                </button>
                {saveStatus && (
                  <p className="mt-2 text-center text-xs font-bold text-emerald-600">
                    {saveStatus}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tips & Sample Prompts */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4 bg-white border border-slate-200">
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <span>💡</span>
              <span>Sample Things You Can Say</span>
            </h3>
            <p className="text-xs text-slate-500">
              The NLP root matcher recognizes colloquial terms, tools, and actions automatically:
            </p>

            <div className="space-y-2.5">
              {samplePrompts.map((prompt, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed hover:border-slate-300 transition"
                >
                  <p className="italic font-medium">"{prompt}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-3 bg-white border border-slate-200">
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <span>⚡</span>
              <span>How SkillBridge AI Works</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>
                  <strong>Root Word Stemming:</strong> When you say "plumbing" or "fixing pipes", our engine tags you as a <em>Plumbing Specialist</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>
                  <strong>Standardized Titles:</strong> Recruiters search for certified trade categories, which are linked to your profile automatically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>
                  <strong>Zero Form Burden:</strong> No typing needed. Simply speak naturally from any mobile or desktop browser.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceStudioView;
