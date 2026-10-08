import React, { useState } from "react";
import StatusToggle from "../../components/StatusToggle";
import { getCategoryStyle } from "../../utils/categoryStyles";

const WorkerProfileView = ({
  userStatus,
  onStatusChange,
  userName,
  setUserName,
  userPhone,
  setUserPhone,
  userBio,
  setUserBio,
  handleSaveProfile,
  saveStatus,
  foundSkills,
  setFoundSkills,
  groupedSkills,
  downloadProfile,
  workerRating,
  workerHistory,
  workerReviews,
  userEmail,
  switchToVoiceStudio,
  dbSkills = [],
}) => {
  const [activeTab, setActiveTab] = useState("skills");
  const [customSkill, setCustomSkill] = useState("");

  const initial = userName?.[0] || userEmail?.[0]?.toUpperCase() || "W";

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!customSkill.trim()) return;
    const trimmed = customSkill.trim();
    if (foundSkills.some((s) => (typeof s === "string" ? s : s.professional_title).toLowerCase() === trimmed.toLowerCase())) {
      alert("This skill is already in your portfolio.");
      return;
    }
    setFoundSkills((prev) => [
      ...prev,
      { professional_title: trimmed, category: "Trade Services" },
    ]);
    setCustomSkill("");
  };

  const handleRemoveSkill = (skillTitle) => {
    setFoundSkills((prev) =>
      prev.filter((s) => (typeof s === "string" ? s : s.professional_title) !== skillTitle)
    );
  };

  const popularSuggestions = [
    "Plumbing & Pipe Fitting",
    "Residential Electrical Wiring",
    "Air Conditioning & HVAC",
    "Interior & Exterior Painting",
    "Carpentry & Woodwork",
    "Masonry & Construction",
    "Welding & Fabrication",
    "Appliance Repair",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Overview Banner (Crisp White Card with subtle gradient accent) */}
      <div className="glass-card p-8 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar & Identity */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 font-display text-3xl font-extrabold text-white shadow-md shadow-blue-500/20">
              {initial}
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${
                  userStatus ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">
                  {userName || "Professional Worker"}
                </h1>
                <span className="badge badge-blue">Verified Laborer</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{userEmail}</p>
              {userPhone && (
                <p className="text-xs text-slate-600 mt-0.5 font-medium">📞 {userPhone}</p>
              )}
            </div>
          </div>

          {/* Availability & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="min-w-60">
              <StatusToggle initialStatus={userStatus} onStatusChange={onStatusChange} />
            </div>

            {foundSkills.length > 0 && (
              <button
                type="button"
                onClick={downloadProfile}
                className="btn-secondary text-xs shrink-0"
                title="Download text resume"
              >
                📄 Export CV
              </button>
            )}
          </div>
        </div>

        {/* Metric Badges Strip */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Client Rating
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-amber-500 text-lg">★</span>
              <strong className="font-display text-2xl font-black text-slate-900">
                {workerRating.avg || "0.0"}
              </strong>
              <span className="text-xs text-slate-500 font-medium">
                ({workerRating.count || 0})
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Completed Jobs
            </span>
            <strong className="mt-1 block font-display text-2xl font-black text-slate-900">
              {workerHistory.length}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Skills
            </span>
            <strong className="mt-1 block font-display text-2xl font-black text-slate-900">
              {foundSkills.length}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Visibility
            </span>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 text-sm font-bold ${
                userStatus ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  userStatus ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              {userStatus ? "Active in Pool" : "Hidden"}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Tabbed Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "skills", label: `Skills & Portfolio (${foundSkills.length})`, icon: "🎯" },
          { id: "contact", label: "Profile & Bio Settings", icon: "⚙️" },
          { id: "reviews", label: `Reviews & Feedback (${workerRating.count || 0})`, icon: "★" },
          { id: "history", label: `Work History (${workerHistory.length})`, icon: "📜" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Skills & Portfolio */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <div className="glass-card p-7 space-y-6 bg-white border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Skills Portfolio
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  These verified skills make your profile discoverable to recruiters in the real-time talent pool.
                </p>
              </div>

              {switchToVoiceStudio && (
                <button
                  type="button"
                  onClick={switchToVoiceStudio}
                  className="btn-primary text-xs"
                >
                  🎙️ Open Voice AI Studio
                </button>
              )}
            </div>

            {/* Quick Add Custom Skill Form */}
            <form onSubmit={handleAddCustomSkill} className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add skill title manually (e.g. Tile Installation, Generator Repair)..."
                className="glass-input text-xs"
              />
              <button type="submit" className="btn-secondary text-xs shrink-0">
                + Add Skill
              </button>
            </form>

            {/* Grouped Skills Display */}
            {Object.keys(groupedSkills).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedSkills).map(([category, skills]) => (
                  <div key={category} className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {category || "Trade Services"} ({skills.length})
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {skills.map((skill, index) => {
                        const title =
                          typeof skill === "string" ? skill : skill.professional_title;

                        return (
                          <div
                            key={`${title}-${index}`}
                            className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition-all ${getCategoryStyle(
                              category
                            )}`}
                          >
                            <span>✓</span>
                            <span>{title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(title)}
                              className="text-slate-400 hover:text-rose-600 transition font-black ml-1"
                              title="Remove skill"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center space-y-3">
                <div className="text-4xl">🎙️</div>
                <h3 className="font-bold text-slate-900 text-base">No Skills Captured Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Use our AI Voice Studio to speak about your experience, or pick from popular trade titles below to get started immediately.
                </p>
                {switchToVoiceStudio && (
                  <button
                    type="button"
                    onClick={switchToVoiceStudio}
                    className="btn-primary text-xs mt-2"
                  >
                    Start AI Voice Registration
                  </button>
                )}
              </div>
            )}

            {/* Quick Suggestions Bar */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Quick Add Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!foundSkills.some((s) => (typeof s === "string" ? s : s.professional_title) === sug)) {
                        setFoundSkills((prev) => [
                          ...prev,
                          { professional_title: sug, category: "Trade Services" },
                        ]);
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="btn-primary text-xs w-full"
              >
                💾 Save Updated Skills to Profile
              </button>
              {saveStatus && (
                <p className="mt-2 text-center text-xs font-bold text-emerald-600">
                  {saveStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profile & Bio Settings */}
      {activeTab === "contact" && (
        <div className="glass-card p-8 max-w-2xl bg-white border border-slate-200">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-1">
            Personal & Contact Settings
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Ensure your details are accurate so recruiters can reach you once a booking is confirmed.
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Full Legal / Professional Name
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Swayam Sahore"
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Contact Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={userPhone.startsWith("+91") ? userPhone.slice(3) : userPhone}
                  onChange={(e) => setUserPhone("+91" + e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="glass-input pl-12"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                🔒 Privacy safe: Hidden from recruiters until you accept their booking.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Professional Bio / Summary
              </label>
              <textarea
                rows={4}
                value={userBio || ""}
                onChange={(e) => setUserBio && setUserBio(e.target.value)}
                placeholder="Briefly describe your years of experience, specialties, tools owned, or certifications..."
                className="glass-input resize-none"
              />
            </div>

            <button type="submit" className="btn-primary w-full text-sm">
              Save Profile Changes
            </button>
            {saveStatus && (
              <p className="text-center text-xs font-bold text-emerald-600">
                {saveStatus}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: Reviews & Reputation */}
      {activeTab === "reviews" && (
        <div className="glass-card p-8 bg-white border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Client Reviews & Reputation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verified reviews left by recruiters after completed bookings.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2">
              <span className="text-amber-500 text-lg">★</span>
              <strong className="font-display text-2xl font-black text-amber-800">
                {workerRating.avg || "0.0"}
              </strong>
              <span className="text-xs text-slate-500 font-medium">/ 5.0</span>
            </div>
          </div>

          {workerReviews.length > 0 ? (
            <div className="space-y-4">
              {workerReviews.map((rev) => (
                <div key={rev._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-500 text-sm font-black">
                      {"★".repeat(rev.rating)}
                      <span className="text-slate-300">
                        {"★".repeat(Math.max(0, 5 - rev.rating))}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-slate-700 mt-3 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="font-bold text-slate-900 text-sm">No reviews yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed jobs with recruiters will generate verified client reviews here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Work History */}
      {activeTab === "history" && (
        <div className="glass-card p-8 bg-white border border-slate-200">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Completed Job History
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Archive of all completed client bookings fulfilled through SkillBridge.
            </p>
          </div>

          {workerHistory.length > 0 ? (
            <div className="space-y-4">
              {workerHistory.map((job) => (
                <div key={job._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {job.jobDescription}
                    </h3>
                    <span className="badge badge-emerald">Completed</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/80">
                    <span>Recruiter: {job.recruiter?.email || "SkillBridge Client"}</span>
                    <span>{new Date(job.completedAt || job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
              <div className="text-3xl mb-2">📜</div>
              <p className="font-bold text-slate-900 text-sm">No completed work history yet</p>
              <p className="text-xs text-slate-500 mt-1">
                When you accept and finish direct bookings, your job log records will be preserved here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerProfileView;
