import React, { useState } from 'react';
import { UserCheck, ShieldAlert, GraduationCap, School, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import AuthModal from './AuthModal';

export default function RoleSelectionScreen({ onAuthSuccess }) {
  const [selectedRole, setSelectedRole] = useState(null); // 'student' | 'instructor' | null

  return (
    <div className="relative min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between p-6 overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Secure Exam Hub</h2>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-widest uppercase">Multi-Org AI Proctoring</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Organization Enforced</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 z-10">
        {/* Title Badge & Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Secure Exam Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Choose Your Portal
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Select your account type to access your organization's tests or manage exam proctoring sessions.
          </p>
        </div>

        {/* 2 Large Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            className="group relative rounded-3xl bg-slate-900/60 border border-white/10 p-8 hover:border-cyan-400/50 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
            
            <div>
              {/* Illustration / Icon Badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300">
                <GraduationCap className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Student Portal</span>
              <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                I am a Student
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                Join your organization's exams, enter Join Codes, view scores, and attempt AI-proctored tests safely.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-cyan-400 transition-colors">
              <span>Continue as Student</span>
              <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Instructor Card */}
          <div
            onClick={() => setSelectedRole('instructor')}
            className="group relative rounded-3xl bg-slate-900/60 border border-white/10 p-8 hover:border-indigo-400/50 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            
            <div>
              {/* Illustration / Icon Badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:border-indigo-400 transition-all duration-300">
                <School className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Instructor Portal</span>
              <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                I am an Instructor
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                Create exams, manage multi-org Join Codes, share invite links, view enrolled students, and monitor proctoring status.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">
              <span>Continue as Instructor</span>
              <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto text-center py-4 z-10 text-xs text-slate-500 border-t border-slate-900">
        Secure Exam Hub &copy; 2026. Organization-Level AI Exam Infrastructure.
      </footer>

      {/* Authentication Modal */}
      {selectedRole && (
        <AuthModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
          onSuccess={(userProfile) => {
            setSelectedRole(null);
            onAuthSuccess(userProfile);
          }}
        />
      )}
    </div>
  );
}
