import React from 'react';
import { ShieldCheck, LogOut, Building2, User } from 'lucide-react';
import { logoutUser } from '../firebase';

export default function Navbar({ user, profile, onLogout }) {
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    onLogout();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070a12]/90 border-b border-white/10 backdrop-blur-xl px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Secure Exam Hub</h2>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Multi-Org Portal</p>
          </div>
        </div>

        {/* User Info & Organization */}
        <div className="flex items-center gap-4">
          {/* Organization Badge */}
          {profile?.organizationName && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium">{profile.organizationName}</span>
            </div>
          )}

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-white">{profile?.name || user?.email?.split('@')[0]}</p>
              <span className="text-[10px] uppercase font-semibold text-cyan-400">
                {profile?.role === 'instructor' ? 'Instructor' : 'Student'}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
