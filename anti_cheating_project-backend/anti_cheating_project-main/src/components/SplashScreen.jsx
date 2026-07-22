import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { auth, getUserProfile } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function SplashScreen({ onFinish }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // 2.5 second splash display
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            try {
              const profile = await getUserProfile(user.uid);
              if (profile) {
                onFinish({ user, profile, target: profile.role === 'instructor' ? 'instructor_dashboard' : 'student_dashboard' });
                return;
              }
            } catch (err) {
              console.error('Error loading user profile on splash:', err);
            }
          }
          onFinish({ target: 'role_selection' });
        });
      }, 400); // smooth fade out transition
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070a12] text-white transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center">
        {/* Animated Shield Logo */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-teal-400 p-0.5 shadow-2xl shadow-cyan-500/30 animate-bounce">
          <div className="w-full h-full bg-[#0b0f19] rounded-[23px] flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-cyan-400 animate-pulse" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* App Title & Tagline with Glassmorphism pill */}
        <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 sm:text-4xl">
            Secure Exam Hub
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] font-semibold text-cyan-400 flex items-center justify-center gap-1.5">
            <span>AI-Powered Proctoring</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1 mt-8 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full animate-splashProgress"></div>
        </div>
      </div>
    </div>
  );
}
