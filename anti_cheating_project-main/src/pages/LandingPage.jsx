import React from 'react';
import { ShieldCheck, Eye, Users, RefreshCw, Activity, ArrowRight } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="flex-1 bg-[#0b0f19] p-6 md:p-12 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column copywriting */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck size={14} /> AI-Powered Integrity Core
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Next-Gen Online
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Assessment Security</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium tracking-wide">Secure. Smart. Fair.</p>
          <p className="text-slate-400 leading-relaxed max-w-xl text-sm">
            Take your exams safely online. We use AI to watch for cheating and keep everyone's exam secure and fair.
          </p>
          <div className="flex items-center gap-4 pt-4 flex-wrap">
            <button onClick={() => onNavigate?.('auth', { role: 'student' })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
              Student Portal <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate?.('auth', { role: 'teacher' })} className="bg-slate-800 border border-slate-700/80 hover:bg-slate-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all">
              Instructor Login
            </button>
          </div>
        </div>

        <div className="lg:col-span-12 mt-14 bg-[#111c44]/50 border border-slate-800/40 rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 bg-[#0b1224] rounded-3xl p-6 border border-slate-800/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Secure Exams</p>
              <h3 className="text-xl font-bold text-white">Face Check & Browser Lock</h3>
              <p className="text-sm text-slate-400">Your camera confirms you're taking the exam. Your browser stays locked on the exam screen.</p>
            </div>
            <div className="space-y-3 bg-[#0b1224] rounded-3xl p-6 border border-slate-800/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Live Monitoring</p>
              <h3 className="text-xl font-bold text-white">AI Watches for Problems</h3>
              <p className="text-sm text-slate-400">Our AI checks for issues like multiple people, looking away, or switching windows.</p>
            </div>
            <div className="space-y-3 bg-[#0b1224] rounded-3xl p-6 border border-slate-800/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Reports & Stats</p>
              <h3 className="text-xl font-bold text-white">See All Results</h3>
              <p className="text-sm text-slate-400">Teachers can see all exam results, scores, and safety reports in one place.</p>
            </div>
          </div>
        </div>

        {/* Right column monitoring display mock */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0f1530] to-[#0b1738] border border-slate-800/60 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[360px] shadow-2xl">
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Monitoring Active
          </div>
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-indigo-600/10 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/5">
              <Eye size={44} />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-bold text-lg tracking-wide">Analyzing Exam Room</h3>
              <p className="text-xs text-slate-400">Biometric stream sync parameters OK</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature bottom matrix blocks */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-2 md:grid-cols-5 gap-4 mt-16 pt-12 border-t border-slate-800/40">
        {[
          { label: "Face Track Focus", desc: "Tracks ocular positional orientation vectors.", icon: Eye },
          { label: "Secondary Context", icon: Users, desc: "Triggers flag alerts on dual human tracking." },
          { label: "Focus Frame Lock", icon: RefreshCw, desc: "Triggers system violation flags on browser blur." },
          { label: "Integrated Risk Metrics", icon: Activity, desc: "Compiles complete volumetric risk calculation indices." },
          { label: "Live System Sync", icon: ShieldCheck, desc: "Real-time updates delivered to instructor console arrays." }
        ].map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div key={index} className="bg-[#111c44]/60 border border-slate-800/40 p-4.5 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Icon size={18} /></div>
              <h4 className="font-bold text-xs text-white tracking-tight">{feat.label}</h4>
              <p className="text-[11px] text-slate-400 leading-normal">{feat.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  );
}