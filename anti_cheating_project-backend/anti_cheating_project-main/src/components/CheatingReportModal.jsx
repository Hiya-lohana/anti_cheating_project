import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, Sparkles, Loader2, FileText, Download } from 'lucide-react';
import { generateAICheatingAnalysis } from '../services/geminiService';

export default function CheatingReportModal({ candidate, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const res = await generateAICheatingAnalysis({
          studentName: candidate.name,
          testTitle: candidate.testTitle || 'Exam Assessment',
          violations: candidate.violations || [],
          tabSwitches: candidate.tabSwitches || 0
        });
        setReport(res);
      } catch (err) {
        console.error('Failed to load AI Cheating report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [candidate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">AI Integrity Audit</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Cheating & Risk Analysis Report</h2>
            <p className="text-xs text-slate-400">Candidate: {candidate.name} ({candidate.email})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">✕</button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs">Analyzing violation logs with Gemini AI...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {/* Risk Verdict Banner */}
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${report?.riskLevel === 'High' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' : report?.riskLevel === 'Moderate' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider">AI Risk Verdict</span>
                <h3 className="text-2xl font-extrabold mt-0.5">{report?.riskLevel || 'Low'} Risk Level</h3>
                <p className="text-xs mt-1 text-slate-300">{report?.verdict}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">AI Integrity Score</span>
                <p className="text-3xl font-extrabold font-mono text-white mt-0.5">{report?.confidenceScore || 90}%</p>
              </div>
            </div>

            {/* Observations & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Key Observations</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {report?.keyObservations?.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instructor Recommendation</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{report?.recommendation}</p>
              </div>
            </div>

            {/* Suspicious Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Suspicious Activity Timeline</h4>
              <div className="space-y-2">
                {(candidate.violations || []).map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${v.severity === 'High' ? 'bg-rose-400' : 'bg-amber-400'}`}></div>
                      <div>
                        <p className="font-bold text-white">{v.type}</p>
                        <p className="text-[10px] text-slate-400">{v.description || 'Proctoring anomaly recorded'}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{v.timestamp || 'Recorded'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
