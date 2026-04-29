import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { user, logout } = useContext(AuthContext);

  const workerLinks = [
    { id: 'profile', icon: '👤', label: 'My Profile' },
    { id: 'bookings', icon: '📅', label: 'My Bookings' }
  ];

  const recruiterLinks = [
    { id: 'talent', icon: '🔍', label: 'Talent Pool' },
    { id: 'bookings', icon: '📅', label: 'My Bookings' }
  ];

  const links = user?.role === 'worker' ? workerLinks : recruiterLinks;

  return (
    <div className="w-64 h-screen bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/50 p-6 flex flex-col justify-between">
      <div>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            SkillBridge<span className="text-white">AI</span>
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-bold">{user?.role} Portal</p>
        </div>

        <nav className="space-y-3">
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => setCurrentView(link.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                currentView === link.id 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/30 text-red-400 hover:bg-red-900/50 rounded-xl font-bold transition-colors border border-red-900/50"
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default Sidebar;
