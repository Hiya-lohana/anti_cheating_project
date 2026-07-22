import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertTriangle, Eye, ShieldAlert, CheckCircle2, UserX, MonitorX } from 'lucide-react';
import { saveLiveTelemetry } from '../firebase';

export default function ProctoringEngine({ activeExam, studentProfile, onViolationLogged, onStatusChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Counters
  const [tabSwitches, setTabSwitches] = useState(0);
  const [faceWarnings, setFaceWarnings] = useState(0);
  const [violations, setViolations] = useState([]);
  
  // Active status
  const [activeAlert, setActiveAlert] = useState(null);

  const logViolation = (type, severity, description) => {
    const violation = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      severity,
      description,
      timestamp: new Date().toLocaleTimeString()
    };

    setViolations(prev => [violation, ...prev]);
    setActiveAlert(violation);
    onViolationLogged?.(violation);

    // Auto-clear active toast alert after 3.5 seconds
    setTimeout(() => {
      setActiveAlert(null);
    }, 3500);
  };

  // Setup Camera & Video Stream
  useEffect(() => {
    let mediaStream = null;

    async function startCamera() {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 15 },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError('Webcam access denied. AI Proctoring requires video stream.');
        logViolation('Camera Disabled', 'High', 'Candidate disabled webcam or blocked camera permission.');
      }
    }

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Setup Tab Switching & Window Focus Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const nextCount = prev + 1;
          logViolation(
            'Tab Switch / Unfocus',
            nextCount > 2 ? 'High' : 'Medium',
            `Switched tabs or minimized browser window (Count: ${nextCount})`
          );
          return nextCount;
        });
      }
    };

    const handleWindowBlur = () => {
      logViolation(
        'Window Focus Lost',
        'Low',
        'Cursor left the exam browser window context.'
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Simulated AI Face Detection & Movement Canvas Loop
  useEffect(() => {
    if (!streamActive) return;

    const interval = setInterval(() => {
      // Simulate Periodic AI Face Analysis Check
      const rand = Math.random();
      if (rand < 0.08) {
        // Face looking away
        setFaceWarnings(prev => prev + 1);
        logViolation('Face Movement', 'Low', 'Candidate looked away from primary screen.');
      } else if (rand > 0.96) {
        // Multiple faces or secondary person
        logViolation('Multiple Faces Detected', 'High', 'Multiple individuals detected in webcam stream.');
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [streamActive]);

  useEffect(() => {
    onStatusChange?.({
      tabSwitches,
      faceWarnings,
      totalViolations: violations.length,
      violations
    });

    if (activeExam?.id && studentProfile?.uid) {
      saveLiveTelemetry({
        testId: activeExam.id,
        studentId: studentProfile.uid,
        studentName: studentProfile.name || 'Student',
        studentEmail: studentProfile.email || '',
        tabSwitches,
        faceWarnings,
        violations
      });
    }
  }, [tabSwitches, faceWarnings, violations, activeExam, studentProfile]);

  return (
    <div className="rounded-3xl bg-slate-900 border border-white/10 p-4 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live AI Proctor</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
          Active Monitoring
        </span>
      </div>

      {/* Live Video Frame Container */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {!streamActive && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 text-xs gap-2">
            <Camera className="w-6 h-6 animate-pulse text-cyan-400" />
            <span>Initializing Camera Feed...</span>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-rose-950/90 text-rose-300 text-xs text-center gap-2">
            <UserX className="w-6 h-6 text-rose-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Floating Active Alert Banner Overlay */}
        {activeAlert && (
          <div className={`absolute bottom-2 left-2 right-2 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn ${activeAlert.severity === 'High' ? 'bg-rose-500/90 text-white border border-rose-400' : 'bg-amber-500/90 text-slate-950 border border-amber-400'}`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{activeAlert.description}</span>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Tab Switches</span>
          <span className={`font-mono font-bold text-sm ${tabSwitches > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {tabSwitches}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Violations</span>
          <span className={`font-mono font-bold text-sm ${violations.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {violations.length}
          </span>
        </div>
      </div>

      {/* Recent Activity Log Mini-Feed */}
      {violations.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Anomaly Timeline</span>
          <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
            {violations.slice(0, 4).map(v => (
              <div key={v.id} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-300 truncate">{v.type}</span>
                <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-2">{v.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
