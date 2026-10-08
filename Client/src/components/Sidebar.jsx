import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { RisingSpanLogo, RisingSpanMark } from "./RisingSpanLogo";

const Sidebar = ({ currentView, setCurrentView }) => {
  const { user, logout } = useContext(AuthContext);

  const workerLinks = [
    {
      id: "profile",
      label: "My Profile",
      description: "Portfolio & reputation",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "voice",
      label: "AI Voice Studio",
      description: "Speech-to-skill AI",
      badge: "AI",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      id: "jobs",
      label: "Browse Jobs",
      description: "Open opportunities",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "applications",
      label: "Applications",
      description: "Status tracker",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "bookings",
      label: "Client Bookings",
      description: "Direct hire requests",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const recruiterLinks = [
    {
      id: "talent",
      label: "Talent Discovery",
      description: "Find verified workers",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: "jobs",
      label: "Post & Manage Jobs",
      description: "Create work listings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: "applications",
      label: "Applicants Pool",
      description: "Review candidates",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "bookings",
      label: "Direct Bookings",
      description: "Contracts & reviews",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const links = user?.role === "worker" ? workerLinks : recruiterLinks;
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl px-2 py-2 md:hidden shadow-lg">
        <div className="flex items-center justify-around gap-1">
          {links.map((link) => {
            const active = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentView(link.id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className={`p-1 rounded-lg ${active ? "text-blue-600" : "text-slate-500"}`}>
                  {link.icon}
                </div>
                <span>{link.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200/90 bg-white p-5 md:flex shadow-[2px_0_12px_-4px_rgba(15,23,42,0.04)]">
        {/* Brand Header */}
        <Link to="/" className="flex items-center px-1 py-1 group">
          <RisingSpanLogo size={36} showTagline={true} />
        </Link>

        {/* User Card */}
        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-display text-base font-bold text-white shadow-sm">
              {initial}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  user?.isOnline ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-slate-400"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.fullName || "Account"}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-2xs">
              {user?.role === "worker" ? "🛠️ Worker" : "💼 Recruiter"}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${user?.isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
              {user?.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Workspace Views
          </p>
          {links.map((link) => {
            const active = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentView(link.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${
                  active
                    ? "bg-blue-50/90 text-blue-900 font-bold border border-blue-200 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                    }`}
                  >
                    {link.icon}
                  </div>
                  <div>
                    <span className="block text-sm leading-tight">{link.label}</span>
                    <span className="block text-[11px] text-slate-500 leading-tight mt-0.5 font-normal">
                      {link.description}
                    </span>
                  </div>
                </div>
                {link.badge && (
                  <span className="badge badge-blue text-[10px] py-0 px-1.5 font-extrabold">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-slate-200 pt-4 space-y-2">
          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            ← View Landing Page
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
