import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Eye, CheckCircle2, UserX, Clock, FileText, RefreshCw } from 'lucide-react';
import { fetchLiveTelemetry } from '../firebase';
import CheatingReportModal from './CheatingReportModal';

export default function LiveMonitoringDashboard({ tests = [] }) {
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [liveTelemetryData, setLiveTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLiveTelemetry = async () => {
    try {
      const telemetryPromises = tests.map(t => fetchLiveTelemetry(t.id));
      const results = await Promise.all(telemetryPromises);
      const combined = results.flat();
      setLiveTelemetryData(combined);
    } catch (e) {
      console.error('Error loading live telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveTelemetry();
    const interval = setInterval(loadLiveTelemetry, 5000); // Polling every 5s for live updates
    return () => clearInterval(interval);
  }, [tests]);

  // Combine enrolled students with Firestore live telemetry or default telemetry
  const activeCandidates = tests.flatMap(t => {
    const enrolled = t.enrolledStudents || [];
    return enrolled.map(s => {
      const live = liveTelemetryData.find(lt => lt.studentId === s.studentId && lt.testId === t.id);
      return {
        ...s,
        testId: t.id,
        testTitle: t.title,
        tabSwitches: live ? live.tabSwitches : 0,
        faceWarnings: live ? live.faceWarnings : 0,
        violations: live ? live.violations : [],
        lastActive: live ? live.lastActive : s.joinedAt
      };
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live AI Monitoring Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">Active Proctoring Streams</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time candidate telemetry, window focus tracking, and anomaly alerts.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadLiveTelemetry} 
            className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Active Candidates</span>
            <p className="text-lg font-extrabold text-white font-mono">{activeCandidates.length}</p>
          </div>
        </div>
      </div>

      {/* Candidates Live Grid */}
      {activeCandidates.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 p-8 space-y-3">
          <Eye className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No active exam sessions</h3>
          <p className="text-xs text-slate-400">When students launch a test in your organization, their live stream telemetry will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCandidates.map((candidate, idx) => {
            const hasHighRisk = candidate.tabSwitches > 2 || (candidate.violations && candidate.violations.length > 2);
            return (
              <div 
                key={candidate.studentId || idx}
                className="rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${hasHighRisk ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {hasHighRisk ? 'Suspicious Activity' : 'Monitoring Clean'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Live Telemetry</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{candidate.name}</h3>
                  <p className="text-xs text-indigo-400 font-medium">{candidate.testTitle}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{candidate.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Tab Switches</span>
                    <p className={`font-mono font-bold text-sm ${candidate.tabSwitches > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {candidate.tabSwitches}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Anomalies</span>
                    <p className="font-mono font-bold text-sm text-amber-400">
                      {candidate.violations?.length || 0}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentReport(candidate)}
                  className="w-full py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-indigo-500/30"
                >
                  <FileText className="w-4 h-4" />
                  <span>View AI Cheating Report</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedStudentReport && (
        <CheatingReportModal
          candidate={selectedStudentReport}
          onClose={() => setSelectedStudentReport(null)}
        />
      )}
    </div>
  );
}
