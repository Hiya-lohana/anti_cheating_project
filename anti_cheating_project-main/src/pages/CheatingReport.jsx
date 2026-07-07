import React, { useState, useEffect } from 'react';
import { Download, Image } from 'lucide-react';
import { getExams, getReports } from '../api';

export default function CheatingReport({ onNavigate, onLogout, user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const exportReportsCSV = (reportsToExport) => {
    if (!reportsToExport || reportsToExport.length === 0) return;
    const keys = ['id','examId','studentName','email','incidentCount','score','status','summary','createdAt'];
    const header = keys.join(',') + '\n';
    const rows = reportsToExport.map(r => keys.map(k => {
      const val = r[k] == null ? '' : String(r[k]).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [examsData, reportsData] = await Promise.all([getExams(), getReports()]);

        // If a teacher is signed in, show reports for exams they created (all statuses)
        if (user?.role === 'teacher') {
          const instructorExamIds = new Set((examsData || []).filter(e => e.createdBy === user.email).map(e => e.id));
          const instructorReports = (reportsData || []).filter(r => r && instructorExamIds.has(r.examId));
          setReports(instructorReports);
          setSelectedReport(instructorReports.length > 0 ? instructorReports[0] : null);
        } else {
          // default: show all reports (student view / demo)
          const allReports = (reportsData || []).filter(r => !!r);
          setReports(allReports);
          setSelectedReport(allReports.length > 0 ? allReports[0] : null);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
        <h1 className="text-2xl font-bold text-white">Integrity Report</h1>
        <p className="text-slate-400 mt-4">Loading reports...</p>
      </div>
    );
  }

  if (!selectedReport) {
    return (
      <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
        <h1 className="text-2xl font-bold text-white">Integrity Report</h1>
        <p className="text-slate-400 mt-4">No reports available yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrity Report</h1>
          <p className="text-slate-400 mt-1">Monitor active student integrity alerts and see which students are flagged during exams.</p>
        </div>
        <button onClick={() => exportReportsCSV(reports)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-md">
          <Download size={16} /> Export Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-[#111c44] border border-slate-800/60 p-8 rounded-2xl shadow-md">
          <h2 className="text-lg font-bold text-white mb-4">No Cheating Reports Yet</h2>
          <p className="text-slate-400">No students are currently flagged. Start a live proctor session or wait for exam data to see active integrity alerts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Students Under Review</h2>
                <p className="text-sm text-slate-400">Click a student to inspect their cheating alert details.</p>
              </div>
              <span className="text-xs uppercase tracking-widest text-slate-400">{reports.length} Reports</span>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <button
                  key={report.id || report._id || report.studentName}
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedReport?.id === report.id || selectedReport?._id === report._id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-[#0b0f19] hover:border-indigo-500 hover:bg-slate-900/80'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{report.studentName || 'Unknown Student'}</p>
                      <p className="text-xs text-slate-400 mt-1">{report.email || 'No email provided'}</p>
                    </div>
                    <span className={`text-[11px] font-semibold uppercase px-2 py-1 rounded-full ${report.incidentCount > 0 ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                      {report.incidentCount > 0 ? `${report.incidentCount} Alert${report.incidentCount === 1 ? '' : 's'}` : 'Clear'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2">{report.summary || 'No summary provided.'}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
            {selectedReport ? (
              <>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Selected Report</h2>
                      <p className="text-sm text-slate-400">Detailed integrity summary for the selected student.</p>
                    </div>
                    <span className={`text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full ${selectedReport.incidentCount > 2 ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
                      {selectedReport.incidentCount > 2 ? 'High Risk' : 'Moderate Risk'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#0b0f19] p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Student</p>
                      <p className="text-sm text-white mt-2">{selectedReport.studentName || 'Unknown'}</p>
                    </div>
                    <div className="bg-[#0b0f19] p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Incidents</p>
                      <p className="text-sm text-white mt-2">{selectedReport.incidentCount || 0}</p>
                    </div>
                    <div className="bg-[#0b0f19] p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Exam ID</p>
                      <p className="text-sm text-white mt-2">{selectedReport.examId || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0b0f19] p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">Violation Summary</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">{selectedReport.summary || 'No summary available for this report.'}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-4 aspect-square flex flex-col items-center justify-center gap-2">
                      <Image size={28} className="text-slate-600" />
                      <p className="text-xs text-slate-500 text-center">Evidence {index}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Select a report from the list to view the student integrity details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}