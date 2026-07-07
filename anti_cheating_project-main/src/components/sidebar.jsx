import React from 'react';
import { LayoutDashboard, FileText, BarChart2, Calendar, User, Settings, LogOut, ShieldAlert } from 'lucide-react';

export default function Sidebar({ activeTab, onNavigate, onLogout, role = 'student', navItems }) {
  const defaultNav = role === 'teacher' ? [
    { id: 'admin', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-exam', label: 'Create Exam', icon: FileText },
    { id: 'report', label: 'Integrity', icon: BarChart2 },
    { id: 'live-proctor', label: 'Live Proctor', icon: ShieldAlert }
  ] : [
    { id: 'student', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-exams', label: 'My Exams', icon: FileText },
    { id: 'student-results', label: 'Results', icon: BarChart2 },
    { id: 'student-analytics', label: 'Analytics', icon: ShieldAlert },
    { id: 'student-calendar', label: 'Calendar', icon: Calendar },
    { id: 'student-profile', label: 'Profile', icon: User },
    { id: 'student-settings', label: 'Settings', icon: Settings }
  ];

  const navigationItems = navItems?.length ? navItems.map((item) => ({ id: item.id, label: item.label, icon: defaultNav.find((nav) => nav.id === item.id)?.icon || FileText })) : defaultNav;

  return (
    <div className="w-64 bg-[#111c44] border-r border-slate-800/40 p-6 flex flex-col justify-between h-[calc(100vh-56px)] sticky top-14 shrink-0">
      <div className="space-y-8">
        {/* Branding header block */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-base tracking-wider font-mono">P</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white leading-none">Secure Exam Hub</span>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-1">{role === 'teacher' ? 'Instructor Portal' : 'Student Portal'}</span>
          </div>
        </div>

        {/* Navigation block links */}
        <nav className="space-y-2">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onNavigate?.(item.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-105' 
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-white hover:pl-5'
                }`}
              >
                <IconComponent size={20} className={`transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout interface block */}
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-400 hover:text-red-400 rounded-2xl hover:bg-red-500/10 transition-all duration-200 hover:pl-5"
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );
}