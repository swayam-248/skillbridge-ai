import React, { useState } from "react";
import { Link } from "react-router-dom";
import { RisingSpanLogo, RisingSpanMark } from "../components/RisingSpanLogo";

const Home = () => {
  const [activeVoiceDemo, setActiveVoiceDemo] = useState(0);

  const demoScenarios = [
    {
      role: "Plumbing & Pipe Specialist",
      speech: "I fix leaking kitchen pipes, replace boiler valves, and solder copper bathroom fittings.",
      extracted: ["Plumbing & Pipe Fitting", "Leak Diagnostics", "Sanitary Fixture Assembly"],
      elevation: "Tier 4 Certified",
      recruiterMatch: "14 local contractors seeking immediate dispatch",
    },
    {
      role: "Residential Electrician",
      speech: "I do full house wiring, install circuit breaker panels, and mount industrial ceiling fans.",
      extracted: ["Electrical Wiring & Layout", "Circuit Breaker Installation", "High-Voltage Diagnostics"],
      elevation: "Tier 4 Certified",
      recruiterMatch: "9 commercial facility managers seeking quotes",
    },
    {
      role: "HVAC & Climate Technician",
      speech: "I service split air conditioners, recharge refrigerant gas, and clean condenser coils.",
      extracted: ["HVAC System Maintenance", "Refrigerant Handling", "Cooling Unit Overhaul"],
      elevation: "Tier 3 Certified",
      recruiterMatch: "12 building operations teams ready to hire",
    },
  ];

  const tradeCategories = [
    { name: "Plumbing & Piping", icon: "🔧", count: "128 Active", tag: "Urgent Dispatch", bg: "bg-cyan-50 border-cyan-200 text-cyan-800" },
    { name: "Electrical & Wiring", icon: "⚡", count: "142 Active", tag: "High Demand", bg: "bg-amber-50 border-amber-200 text-amber-800" },
    { name: "AC & HVAC Maintenance", icon: "❄️", count: "95 Active", tag: "Certified", bg: "bg-blue-50 border-blue-200 text-blue-800" },
    { name: "Carpentry & Woodwork", icon: "🪚", count: "78 Active", tag: "Verified", bg: "bg-stone-50 border-stone-200 text-stone-800" },
    { name: "Interior & Exterior Painting", icon: "🎨", count: "110 Active", tag: "Popular", bg: "bg-purple-50 border-purple-200 text-purple-800" },
    { name: "Masonry & Civil Construction", icon: "🧱", count: "64 Active", tag: "Verified", bg: "bg-orange-50 border-orange-200 text-orange-800" },
    { name: "Welding & Metal Fabrication", icon: "👨‍🏭", count: "53 Active", tag: "Certified", bg: "bg-slate-100 border-slate-200 text-slate-800" },
    { name: "Logistics & Transport", icon: "🚚", count: "89 Active", tag: "Instant Hire", bg: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  ];

  const risingSpanSteps = [
    {
      tier: "TIER 01",
      title: "Speak Raw Experience",
      desc: "Speak your daily work in plain words. No resume writing, no typing, no barrier to entry.",
      accent: "from-blue-600 to-indigo-600",
      highlight: "Voice AI Active",
    },
    {
      tier: "TIER 02",
      title: "The Rising Span Synthesis",
      desc: "Our NLP root-stemming engine standardizes conversational verbs into recognized trade titles.",
      accent: "from-indigo-600 to-blue-500",
      highlight: "Compromise NLP",
    },
    {
      tier: "TIER 03",
      title: "Direct Live Dispatch",
      desc: "Toggle your availability switch online to immediately appear on recruiter radar maps.",
      accent: "from-blue-500 to-cyan-500",
      highlight: "Real-Time Booking",
    },
    {
      tier: "TIER 04",
      title: "Reputation Elevation",
      desc: "Complete jobs, unlock client reviews, and build a verified 5-star track record that increases your earnings.",
      accent: "from-cyan-500 to-teal-400",
      highlight: "Verified Trust",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white">
      {/* 1. Sticky Navigation with The Rising Span Identity */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl transition-all shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center group">
            <RisingSpanLogo size={42} showTagline={true} />
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#rising-span" className="hover:text-blue-600 transition">The Rising Span</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition">Ascension Process</a>
            <a href="#voice-demo" className="hover:text-blue-600 transition">AI Voice Studio</a>
            <a href="#trades" className="hover:text-blue-600 transition">Trades</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-xs">
              Log In
            </Link>
            <Link to="/login" className="btn-primary text-xs shadow-md shadow-blue-500/20">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section: The Rising Span Architectural Concept */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200">
        {/* Ambient Glows echoing Cyan & Azure */}
        <div className="absolute left-1/3 -top-28 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-36 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-200 bg-cyan-50/80 px-4 py-1.5 text-xs font-extrabold text-cyan-900 shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                THE RISING SPAN ARCHITECTURE • SKILLED LABOR MARKETPLACE
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.1]">
                From Hands-On Labor To Verified Value.{" "}
                <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
                  Cross The Rising Span.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                SkillBridge bridges the gap between manual experience and professional elevation. Speak your work history naturally — our AI extracts certified skills and connects you to live recruiter dispatch.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login"
                  className="btn-primary w-full sm:w-auto px-7 py-3.5 text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <RisingSpanMark size={20} className="brightness-125" />
                  <span>Build Worker Profile with Voice</span>
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-sm"
                >
                  🔍 Hire Skilled Talent (Recruiter)
                </Link>
              </div>

              {/* Metric Callouts */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-left">
                <div>
                  <strong className="block font-display text-2xl font-black text-slate-950">42+</strong>
                  <span className="text-xs text-slate-500 font-semibold">Standardized Trades</span>
                </div>
                <div>
                  <strong className="block font-display text-2xl font-black text-slate-950">&lt; 90s</strong>
                  <span className="text-xs text-slate-500 font-semibold">Voice Onboarding</span>
                </div>
                <div>
                  <strong className="block font-display text-2xl font-black text-slate-950">100%</strong>
                  <span className="text-xs text-slate-500 font-semibold">Privacy-Protected</span>
                </div>
              </div>
            </div>

            {/* Right Card: The Rising Span Architectural Live Simulation */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-float">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-[0_25px_60px_-15px_rgba(2,132,199,0.15)] relative overflow-hidden">
                {/* Decorative rising span watermark */}
                <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
                  <RisingSpanMark size={180} />
                </div>

                {/* Profile Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-teal-400 font-display font-bold text-white shadow-md shadow-cyan-500/25">
                      S
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-950 text-sm">Swayam Sahore</h3>
                      <p className="text-xs text-slate-500 font-medium">Master Plumber & Pipe Specialist</p>
                    </div>
                  </div>

                  <span className="badge badge-emerald">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Live on the Span
                  </span>
                </div>

                {/* Simulated Audio Stream with Cyan-to-Blue Spectrum */}
                <div className="mt-5 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/70 via-blue-50/40 to-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                      <span>🎙️</span> AI Voice Input Stream
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(7)].map((_, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400 animate-soundwave"
                          style={{
                            height: "20px",
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs italic text-slate-800 leading-relaxed font-semibold">
                    "I repair high-pressure water lines, solder copper couplings, and install residential hot water boilers..."
                  </p>
                </div>

                {/* Rising Span Transformation Ladder */}
                <div className="mt-5 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    The Rising Span Synthesis:
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between rounded-xl border border-cyan-200/80 bg-cyan-50/60 px-3 py-2 text-xs font-bold text-cyan-950">
                      <span>✓ High-Pressure Pipe Fitting</span>
                      <span className="text-[10px] font-extrabold text-cyan-700 uppercase">Tier 4</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/60 px-3 py-2 text-xs font-bold text-blue-950">
                      <span>✓ Thermal Boiler Maintenance</span>
                      <span className="text-[10px] font-extrabold text-blue-700 uppercase">Tier 3</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/60 px-3 py-2 text-xs font-bold text-indigo-950">
                      <span>✓ Copper Joint Soldering</span>
                      <span className="text-[10px] font-extrabold text-indigo-700 uppercase">Tier 2</span>
                    </div>
                  </div>
                </div>

                {/* Rating & Dispatch Trigger */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                    <span>★</span>
                    <span className="text-slate-900 font-extrabold">4.95</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5.0 (32 reviews)</span>
                  </div>
                  <button className="btn-primary text-xs py-2 shadow-xs">
                    ⚡ Instant Booking: Ready
                  </button>
                </div>
              </div>

              {/* Floating Cantilever Badge */}
              <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm">
                  <RisingSpanMark size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Career Ascension</p>
                  <p className="text-[10px] text-slate-500 font-medium">From manual labor to verified market value</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4-Tier Ascension Workflow ("The Rising Span Blueprint") */}
      <section id="rising-span" className="py-20 md:py-28 bg-white border-b border-slate-200 relative overflow-hidden">
        {/* Subtle Architectural Blueprint Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#0284c7 1px, transparent 1px), linear-gradient(90deg, #0284c7 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="badge badge-blue">
              <RisingSpanMark size={14} className="inline mr-1 -mt-0.5" />
              Architectural Concept Breakdown
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-950 mt-2">
              The Rising Span: Elevating Skilled Labor
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Modeled after the stepped architectural bridge in our brand identity: each tier bridges the gap between raw labor and market-recognized value.
            </p>
          </div>

          {/* Interactive Span Architecture Visualization */}
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-center mb-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/30 rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            {/* Left: The Architectural Blueprint Model */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 left-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                FIG 1.0 • STRUCTURAL CANTILEVER ELEVATION
              </div>
              <div className="my-8 flex justify-center">
                <RisingSpanMark size={140} className="filter drop-shadow-md transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="flex items-center justify-between w-full border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500 font-mono">
                <span>[BASE TIER 01]</span>
                <span className="text-cyan-600">▲ ASCENSION VECTOR</span>
                <span className="text-blue-600">[CROWN TIER 04]</span>
              </div>
            </div>

            {/* Right: Tier Detail Ladder */}
            <div className="space-y-3.5">
              {risingSpanSteps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-cyan-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-black text-blue-700 border border-blue-100">
                        0{index + 1}
                      </span>
                      <h3 className="font-display text-base font-extrabold text-slate-950 group-hover:text-blue-600 transition">
                        {step.title}
                      </h3>
                    </div>
                    <span className="badge badge-blue text-[10px] font-extrabold">{step.highlight}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2.5 pl-10 font-medium">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Voice Studio Simulator */}
      <section id="voice-demo" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge badge-emerald">Interactive Test Station</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-950 mt-2">
              Experience The Voice Translation Span
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Select a trade below to see how spoken daily tasks cross the span into certified titles.
            </p>
          </div>

          {/* Interactive Trade Selectors */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {demoScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => setActiveVoiceDemo(index)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  activeVoiceDemo === index
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {scenario.role}
              </button>
            ))}
          </div>

          {/* Demonstration Console */}
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Worker Audio Transcript
                </span>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 mb-2 text-cyan-700 text-xs font-bold">
                    <span>🎙️ Spoken Words</span>
                  </div>
                  <p className="text-sm font-medium italic text-slate-800 leading-relaxed">
                    "{demoScenarios[activeVoiceDemo].speech}"
                  </p>
                </div>
                <p className="mt-3 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                  <span>✓</span> {demoScenarios[activeVoiceDemo].recruiterMatch}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Standardized Span Titles
                </span>
                <div className="mt-2 space-y-2">
                  {demoScenarios[activeVoiceDemo].extracted.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/60 p-3.5 shadow-2xs transition"
                    >
                      <span className="text-xs font-bold text-cyan-950">
                        {skill}
                      </span>
                      <span className="badge badge-blue text-[10px]">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trade Categories */}
      <section id="trades" className="py-20 md:py-28 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="badge badge-amber">Broad Field Coverage</span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-950 mt-2">
                Certified Trade Categories
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Explore active trades currently spanning across the SkillBridge marketplace.
              </p>
            </div>
            <Link to="/login" className="btn-secondary text-xs shrink-0">
              Browse Full Talent Pool →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tradeCategories.map((cat, i) => (
              <div
                key={i}
                className="glass-card-hover p-5 bg-white border border-slate-200 flex items-start justify-between gap-4 cursor-pointer"
              >
                <div>
                  <span className="text-2xl">{cat.icon}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-3">{cat.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{cat.count}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cat.bg}`}>
                  {cat.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Dual Audience Value Proposition */}
      <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* For Workers */}
            <div className="rounded-3xl border border-cyan-200 bg-white p-8 md:p-10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="badge badge-blue">For Skilled Tradespeople</span>
                <h3 className="font-display text-2xl md:text-3xl font-extrabold text-slate-950 mt-3">
                  Never write a resume again. Let your work speak.
                </h3>
                <ul className="mt-6 space-y-3.5 text-sm text-slate-600 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="text-cyan-600 font-bold text-base">✓</span>
                    <span><strong>Hands-free voice setup:</strong> Speak in your natural cadence to build a verified profile in under 2 minutes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-cyan-600 font-bold text-base">✓</span>
                    <span><strong>Real-time dispatch control:</strong> Flip your availability online when you want work; turn offline when busy.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-cyan-600 font-bold text-base">✓</span>
                    <span><strong>Protected contacts:</strong> Your phone number is strictly locked until you confirm and accept a job booking.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-cyan-600 font-bold text-base">✓</span>
                    <span><strong>Ascending reputation:</strong> Build a verified star rating history that travels with you forever.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link to="/login" className="btn-primary w-full text-center">
                  Ascend With Voice Profile →
                </Link>
              </div>
            </div>

            {/* For Recruiters */}
            <div className="rounded-3xl border border-blue-200 bg-white p-8 md:p-10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="badge badge-emerald">For Recruiters & Contractors</span>
                <h3 className="font-display text-2xl md:text-3xl font-extrabold text-slate-950 mt-3">
                  Find available labor in minutes, not days.
                </h3>
                <ul className="mt-6 space-y-3.5 text-sm text-slate-600 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-600 font-bold text-base">✓</span>
                    <span><strong>Natural problem matching:</strong> Type <em>"Need someone to repair a leaking sink today"</em> and immediately match relevant plumbers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-600 font-bold text-base">✓</span>
                    <span><strong>Active radar dispatch:</strong> See who is active now and ready to accept immediate jobs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-600 font-bold text-base">✓</span>
                    <span><strong>1-Click Job Postings:</strong> Publish openings to the board and review applicant portfolios directly.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-600 font-bold text-base">✓</span>
                    <span><strong>Verified reviews network:</strong> Leave transparent feedback after job completion to keep standards high.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link to="/login" className="btn-secondary w-full text-center">
                  Book Skilled Labor →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Banner with Rising Span Arc */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 text-center space-y-6">
          <div className="flex justify-center mb-2">
            <RisingSpanMark size={48} className="brightness-150" />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            ⚡ Ready to Cross The Rising Span?
          </span>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Turn Practical Labor Into Guaranteed Career Mobility.
          </h2>

          <p className="text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
            Join hundreds of plumbers, electricians, carpenters, and contractors building their trust network on SkillBridge.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-sm font-extrabold text-blue-800 shadow-xl transition-all hover:bg-slate-50 hover:scale-105"
            >
              Get Started for Free →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              Sign In as Recruiter
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Editorial Footer with The Rising Span Wordmark */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <RisingSpanLogo size={36} showTagline={false} />
            <span className="text-xs text-slate-400">© 2026. Skilled Labor Marketplace.</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a href="#rising-span" className="hover:text-blue-600 transition">The Rising Span</a>
            <a href="#trades" className="hover:text-blue-600 transition">Trades</a>
            <Link to="/login" className="hover:text-blue-600 transition">Sign In</Link>
            <Link to="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
