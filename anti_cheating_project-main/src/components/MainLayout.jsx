import React from 'react';
import Sidebar from './Sidebar';

const pageTitles = {
  student: 'Dashboard',
  'student-exams': 'My Exams',
  'student-results': 'Results',
  'student-analytics': 'Analytics',
  'student-calendar': 'Calendar',
  'student-profile': 'Profile',
  'student-settings': 'Settings',
  admin: 'Instructor Dashboard',
  'create-exam': 'Create Exam',
  report: 'Integrity Report',
  'live-proctor': 'Live Proctor',
  exam: 'Exam Room'
};

export default function MainLayout({ children, currentTab, onNavigate, user, onLogout, navItems }) {
  const title = pageTitles[currentTab] || 'Secure Exam Hub';

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      <Sidebar activeTab={currentTab} onNavigate={onNavigate} onLogout={onLogout} role={user?.role} navItems={navItems} />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-slate-800/50 bg-[#0b111a]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/80">Welcome back, {user?.name || 'Learner'}</p>
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-300">Role: {user?.role === 'teacher' ? 'Instructor' : 'Student'}</span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
