import React from "react";

/**
 * The Rising Span Logo
 * Faithfully matches "The Rising Span" brand identity concept:
 * - Stepped upward architectural tiers (royal azure on left, vibrant cyan on right)
 * - Ascending diagonal cantilever beam spanning bottom-left to top-center deck
 * - Arched underclearance
 * - "SKILLBRIDGE" wordmark with iconic leaping bridge arc & circular terminus
 * - "SKILLED LABOR MARKETPLACE" tracked subtitle
 */
export const RisingSpanMark = ({ className = "w-10 h-10", size = 42 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main Azure to Cyan Gradient */}
        <linearGradient id="risingSpanGradDeck" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#00F2FE" />
        </linearGradient>

        {/* Diagonal Ascending Span Gradient */}
        <linearGradient id="risingSpanBeamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="40%" stopColor="#2563EB" />
          <stop offset="80%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#00F2FE" />
        </linearGradient>

        {/* Right Slats Cyan/Turquoise Gradient */}
        <linearGradient id="risingSpanRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Left Slats Royal Blue */}
        <linearGradient id="risingSpanLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Top Center Deck (Horizontal cantilever bar) */}
      <rect x="28" y="6" width="44" height="7.5" rx="3.75" fill="url(#risingSpanGradDeck)" />

      {/* LEFT STEPPED SLATS (Royal Azure Tier Ladder) */}
      {/* Tier 2 Left */}
      <rect x="20" y="18" width="22" height="7.5" rx="3.75" fill="url(#risingSpanLeftGrad)" opacity="0.95" />
      {/* Tier 3 Left */}
      <rect x="12" y="30" width="22" height="7.5" rx="3.75" fill="url(#risingSpanLeftGrad)" opacity="0.88" />
      {/* Tier 4 Left (Base) */}
      <rect x="4" y="42" width="22" height="7.5" rx="3.75" fill="url(#risingSpanLeftGrad)" opacity="0.8" />

      {/* RIGHT STEPPED SLATS (Vibrant Cyan-Turquoise Tier Ladder) */}
      {/* Tier 2 Right */}
      <rect x="58" y="18" width="22" height="7.5" rx="3.75" fill="url(#risingSpanRightGrad)" />
      {/* Tier 3 Right */}
      <rect x="66" y="30" width="22" height="7.5" rx="3.75" fill="url(#risingSpanRightGrad)" />
      {/* Tier 4 Right (Base) */}
      <rect x="74" y="42" width="22" height="7.5" rx="3.75" fill="url(#risingSpanRightGrad)" />

      {/* THE RISING SPAN (Diagonal structural beam ascending up from left base to top) */}
      <path
        d="M4 51.5 L18 51.5 L50 13.5 L64 13.5 L34 51.5 L4 51.5 Z"
        fill="url(#risingSpanBeamGrad)"
      />

      {/* Bridge Arch Underclearance Accent curve */}
      <path
        d="M32 50 Q 50 30 68 50"
        stroke="#00F2FE"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
};

export const RisingSpanLogo = ({
  size = 42,
  showTagline = true,
  theme = "light",
  className = "",
}) => {
  const isDark = theme === "dark";
  const skillColor = isDark ? "text-white" : "text-slate-900";
  const taglineColor = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {/* Logo Mark */}
      <RisingSpanMark size={size} className="shrink-0 transition-transform duration-300 hover:scale-105" />

      {/* Wordmark with Leaping Bridge Arc */}
      <div className="flex flex-col justify-center">
        <div className="relative leading-none select-none">
          {/* Main Typography */}
          <div className="flex items-center tracking-tight">
            <span className={`font-display text-2xl font-black ${skillColor}`}>
              SKILL
            </span>
            <span className="font-display text-2xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent">
              BRIDGE
            </span>
          </div>

          {/* The signature leaping bridge arc over "BRIDGE" */}
          <svg
            className="absolute -top-3.5 right-0 w-16 h-4 pointer-events-none"
            viewBox="0 0 65 18"
            fill="none"
          >
            <path
              d="M2 16 C 14 3, 44 2, 58 10"
              stroke="url(#wordmarkArcGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="58" cy="10" r="2.5" fill="#00F2FE" />
            <defs>
              <linearGradient id="wordmarkArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#00F2FE" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Subtitle from the concept sheet */}
        {showTagline && (
          <span
            className={`font-display text-[8.5px] font-extrabold uppercase tracking-[0.24em] ${taglineColor} mt-1`}
          >
            SKILLED LABOR MARKETPLACE
          </span>
        )}
      </div>
    </div>
  );
};

export default RisingSpanLogo;

