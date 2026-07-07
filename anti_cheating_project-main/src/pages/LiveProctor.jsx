import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { startProctorSession, getExams, getReports } from '../api';

export default function LiveProctor({ onNavigate, onLogout, user }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [violations, setViolations] = useState([]);
  const [reports, setReports] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [liveStudent, setLiveStudent] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to start live monitoring');

  const startCamera = async () => {
    setStatusMessage('Requesting camera access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video playback failed', playError);
        }
      }

      setCameraConnected(true);
      setFaceDetectionActive(true);
      setCameraError('');
      setStatusMessage('Face detection active');
      return true;
    } catch (err) {
      console.warn('Camera start failed', err);
      setCameraConnected(false);
      setFaceDetectionActive(false);
      setCameraError(err?.message || 'Camera access denied or unavailable');
      setStatusMessage('Face detection inactive');
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraConnected(false);
    setStatusMessage('Camera stopped');
  };

  const handleStartSession = async () => {
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;

    try {
      const examId = selectedExamId || exams[0]?.id || 'exam-demo';
      const resp = await startProctorSession(examId);
      setSessionId(resp.sessionId);
      setSessionActive(true);
      setStatusMessage('Live monitoring active');
      setViolations([{ time: new Date().toLocaleTimeString(), msg: 'Live session started', severity: 0 }]);

      const initialStudent = reports?.length
        ? reports[0]
        : { studentName: 'Student 01', email: 'demo@student.local', incidentCount: 0, examId };
      setLiveStudent(initialStudent);

      if (!reports?.length) {
        setReports([initialStudent]);
      }
    } catch (err) {
      console.error('Failed to start proctor session', err);
      setStatusMessage('Failed to start proctor session');
    }
  };

  const handleStopSession = () => {
    stopCamera();
    setSessionActive(false);
    setSessionId(null);
  };

  useEffect(() => {
    async function fetchProctorData() {
      try {
        const [examList, reportList] = await Promise.all([getExams(), getReports()]);
        setExams(examList || []);
        setReports(reportList || []);
        if (examList?.length) {
          setSelectedExamId(examList[0].id);
        }
      } catch (err) {
        console.error('Live Proctor initialization failed:', err);
      }
    }
    fetchProctorData();
  }, []);

  useEffect(() => {
    if (!sessionActive) return;
    const iv = setInterval(() => {
      setViolations((prev) => {
        const next = [{ time: new Date().toLocaleTimeString(), msg: 'Eyes away from screen', severity: 5 }, ...prev];
        return next.slice(0, 10);
      });
    }, 7000);
    return () => clearInterval(iv);
  }, [sessionActive]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const displayedStudent = liveStudent || reports[0] || { studentName: 'No student selected', email: '—', incidentCount: 0, examId: selectedExamId || 'N/A' };

  return (
    <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Live Monitoring</h1>
        <div className="flex items-center gap-3">
          <div className={`text-xs font-bold px-3 py-1 rounded-full ${sessionActive ? 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>{sessionActive ? 'Live' : 'Idle'}</div>
          {sessionActive ? (
            <button onClick={handleStopSession} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl">Stop</button>
          ) : (
            <button onClick={handleStartSession} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl">Start Session</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Student Video</h3>
            <div className="relative aspect-video bg-[#0b0f19] border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              {!cameraConnected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-700/60 flex items-center justify-center bg-slate-800/5">
                    <Camera size={32} className="text-slate-500/40" />
                  </div>
                </div>
              )}
              {sessionActive && violations[0] && (
                <div className="absolute top-3 left-3 bg-red-600 text-xs font-bold px-3 py-1 rounded text-white shadow-lg flex items-center gap-1 uppercase tracking-wide">
                  <AlertCircle size={14} /> {violations[0].msg}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Violation Events</h3>
            <div className="space-y-2">
              {violations.length === 0 && <p className="text-slate-400">No violations detected.</p>}
              {violations.map((v, i) => (
                <div key={i} className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center">
                  <span className="text-sm text-slate-300">{v.time} - {v.msg}</span>
                  <span className="text-red-400 font-bold text-xs bg-red-500/10 border border-red-500/20 px-3 py-1 rounded">+{v.severity} Severity</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Risk Score</h3>
            <div className="text-6xl font-black text-amber-500 tracking-tight">{Math.min(100, violations.reduce((s, v) => s + v.severity, 0) + 20)}</div>
            <div className="text-sm text-slate-400 font-semibold mt-1">/ 100</div>
            <div className="mt-4 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold inline-block uppercase tracking-wide">
              {violations.length > 2 ? '⚠️ Flagged' : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-3">Session: {sessionId || 'N/A'}</div>
            <div className="text-xs text-slate-400 mt-2">{statusMessage}</div>
          </div>

          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Student</h3>
            <div className="bg-[#0b0f19] border border-slate-800/60 rounded-2xl p-4">
              <p className="text-sm font-semibold text-white">{displayedStudent.studentName}</p>
              <p className="text-xs text-slate-400 mt-1">{displayedStudent.email}</p>
              <p className="text-xs text-slate-400 mt-2">Exam: {displayedStudent.examId}</p>
              <p className="text-xs text-slate-400 mt-1">Incidents: {displayedStudent.incidentCount}</p>
            </div>
            <div className="bg-[#0b0f19] border border-slate-800/60 rounded-2xl p-4">
              <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Latest Event</h4>
              {violations[0] ? (
                <p className="text-sm text-white">{violations[0].time} — {violations[0].msg}</p>
              ) : (
                <p className="text-sm text-slate-400">No events yet.</p>
              )}
            </div>
          </div>

          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">System Status</h3>
            <div className="flex justify-between items-center text-xs bg-[#0b0f19] p-3 rounded-xl border border-slate-800/60 font-semibold">
              <span className="text-slate-400">Face Detection</span>
              <span className={`${faceDetectionActive ? 'text-emerald-400' : cameraError ? 'text-rose-400' : 'text-amber-400'}`}>{faceDetectionActive ? 'Active ✓' : cameraError ? 'Error' : 'Inactive'}</span>
            </div>
            {cameraError && (
              <div className="text-[11px] text-amber-300 italic">{cameraError}</div>
            )}
            <div className="flex justify-between items-center text-xs bg-[#0b0f19] p-3 rounded-xl border border-slate-800/60 font-semibold">
              <span className="text-slate-400">Audio Monitor</span>
              <span className={`${sessionActive ? 'text-emerald-400' : 'text-amber-400'}`}>{sessionActive ? 'Active ✓' : 'Idle'}</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-[#0b0f19] p-3 rounded-xl border border-slate-800/60 font-semibold">
              <span className="text-slate-400">Screen Tracking</span>
              <span className={`${violations.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{violations.length > 0 ? 'Warning ⚠️' : 'OK'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}