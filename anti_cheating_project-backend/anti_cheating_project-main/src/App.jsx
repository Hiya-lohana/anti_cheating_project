import React, { useState } from 'react';
import SplashScreen from './components/SplashScreen';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import ProctoringEngine from './components/ProctoringEngine';
import { auth, getUserProfile, submitTestResult } from './firebase';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  
  // Exam progress state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [proctoringTelemetry, setProctoringTelemetry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSplashFinish = ({ user, profile, target }) => {
    if (user && profile) {
      setUser(user);
      setProfile(profile);
      setScreen(target);
    } else {
      setScreen('role_selection');
    }
  };

  const handleAuthSuccess = (userProfile) => {
    setProfile(userProfile);
    setUser(auth.currentUser);
    if (userProfile.role === 'instructor') {
      setScreen('instructor_dashboard');
    } else {
      setScreen('student_dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setActiveExam(null);
    setScreen('role_selection');
  };

  const handleLaunchExam = (test) => {
    setActiveExam(test);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScreen('exam');
  };

  const handleOptionSelect = (qId, optionIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const questions = activeExam?.questions || [
    {
      id: 'q1',
      question: 'What is the primary function of the Transport Layer in the OSI Model?',
      options: ['Physical bit transmission', 'End-to-end communication & flow control', 'Routing packets across networks', 'Data formatting and encryption'],
      correctAnswerIndex: 1,
      explanation: 'The Transport Layer (Layer 4) manages end-to-end communication, error recovery, and flow control.'
    },
    {
      id: 'q2',
      question: 'Which protocol is used for secure encrypted web traffic?',
      options: ['HTTP', 'FTP', 'HTTPS / TLS', 'SMTP'],
      correctAnswerIndex: 2,
      explanation: 'HTTPS encrypts data over SSL/TLS.'
    }
  ];

  const handleSubmitExam = async () => {
    if (!activeExam || !profile) {
      setScreen('student_dashboard');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctAnswerIndex) {
          correctCount++;
        }
      });

      await submitTestResult({
        testId: activeExam.id,
        studentId: profile.uid,
        studentName: profile.name || 'Student',
        studentEmail: profile.email || '',
        score: correctCount,
        totalQuestions: questions.length,
        tabSwitches: proctoringTelemetry?.tabSwitches || 0,
        violations: proctoringTelemetry?.violations || []
      });
    } catch (err) {
      console.error('Failed to save exam submission:', err);
    } finally {
      setSubmitting(false);
      setActiveExam(null);
      setScreen('student_dashboard');
    }
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {screen === 'splash' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {screen === 'role_selection' && (
        <RoleSelectionScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {screen === 'student_dashboard' && profile && (
        <StudentDashboard
          user={user}
          profile={profile}
          onLogout={handleLogout}
          onLaunchExam={handleLaunchExam}
        />
      )}

      {screen === 'instructor_dashboard' && profile && (
        <InstructorDashboard
          user={user}
          profile={profile}
          onLogout={handleLogout}
        />
      )}

      {/* Active AI Proctored Exam Screen */}
      {screen === 'exam' && activeExam && (
        <div className="min-h-screen flex flex-col bg-[#070a12] p-6 space-y-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                AI Proctored Exam Active
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-1">{activeExam.title}</h1>
            </div>

            <button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all self-start sm:self-auto disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit & End Exam'}
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            {/* Question Container */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-white/10 p-8 flex flex-col justify-between space-y-6 shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Duration: {activeExam.durationMinutes || 60} mins
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white leading-relaxed">
                  {currentQ?.question}
                </h2>

                <div className="mt-6 space-y-3">
                  {currentQ?.options?.map((opt, idx) => {
                    const isSelected = selectedAnswers[currentQ.id] === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOptionSelect(currentQ.id, idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs font-medium ${isSelected ? 'bg-cyan-500/10 border-cyan-400 text-white font-bold ring-1 ring-cyan-500/50' : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                      >
                        <span>{opt}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold transition-all"
                >
                  Previous
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-cyan-500/10"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar Live Proctoring Widget */}
            <div className="space-y-6">
              <ProctoringEngine
                activeExam={activeExam}
                studentProfile={profile}
                onStatusChange={(telemetry) => setProctoringTelemetry(telemetry)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
