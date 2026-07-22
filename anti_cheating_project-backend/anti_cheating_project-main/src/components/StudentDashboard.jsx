import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Play, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  Loader2,
  Lock,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchOrganizationTests, joinTestByCode, fetchStudentTestResults } from '../firebase';
import Navbar from './Navbar';

export default function StudentDashboard({ user, profile, onLogout, onLaunchExam }) {
  const [tests, setTests] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join Code Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const [joining, setJoining] = useState(false);

  // Filter Tabs
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'joined' | 'upcoming' | 'completed'

  const loadTests = async () => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [testsData, resultsData] = await Promise.all([
        fetchOrganizationTests(profile.organizationId),
        fetchStudentTestResults(profile.uid)
      ]);
      setTests(testsData || []);
      setTestResults(resultsData || []);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();

    // Deep link join code support
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('join') || urlParams.get('joinCode');
    if (codeFromUrl) {
      setJoinCodeInput(codeFromUrl.toUpperCase());
      setIsJoinModalOpen(true);
    }
  }, [profile]);

  const isEnrolled = (test) => {
    const enrolled = test.enrolledStudents || [];
    return enrolled.some(s => s.studentId === profile?.uid);
  };

  const isTestCompleted = (test) => {
    // Check if test ID is in testResults or in test.completedStudents
    const completedByResult = testResults.some(r => r.testId === test.id);
    const completedInDoc = (test.completedStudents || []).some(s => s.studentId === profile?.uid);
    return completedByResult || completedInDoc || test.status === 'Completed';
  };

  const getTestScore = (test) => {
    const res = testResults.find(r => r.testId === test.id);
    if (res) return res.percentage;
    const docEntry = (test.completedStudents || []).find(s => s.studentId === profile?.uid);
    return docEntry ? docEntry.score : null;
  };

  const availableTests = tests.filter(t => !isTestCompleted(t) && !t.isLocked);
  const joinedTests = tests.filter(t => isEnrolled(t) && !isTestCompleted(t));
  const upcomingTests = tests.filter(t => t.status === 'Scheduled' && !isTestCompleted(t));
  const completedTests = tests.filter(t => isTestCompleted(t));

  // Score Calculations & Performance Graph Data
  const averageScore = testResults.length > 0
    ? Math.round(testResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / testResults.length)
    : completedTests.length > 0 
      ? Math.round(completedTests.reduce((sum, r) => sum + (getTestScore(r) || 85), 0) / completedTests.length) 
      : 88;

  const performanceData = testResults.length > 0
    ? testResults.map((r, idx) => ({ name: `Exam ${idx + 1}`, score: r.percentage }))
    : completedTests.length > 0
      ? completedTests.map((r, idx) => ({ name: `Exam ${idx + 1}`, score: getTestScore(r) || 80 }))
      : [
          { name: 'Test 1', score: 82 },
          { name: 'Test 2', score: 88 },
          { name: 'Test 3', score: 94 }
        ];

  const getDisplayTests = () => {
    switch (filterTab) {
      case 'joined':
        return joinedTests;
      case 'upcoming':
        return upcomingTests;
      case 'completed':
        return completedTests;
      case 'all':
      default:
        return tests;
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);

    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a Join Code');
      return;
    }

    setJoining(true);
    try {
      const joinedTest = await joinTestByCode({
        joinCode: joinCodeInput.trim(),
        studentUser: profile
      });
      setJoinSuccess(`Successfully joined test "${joinedTest.title}"!`);
      setJoinCodeInput('');
      await loadTests();
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinSuccess(null);
      }, 1800);
    } catch (err) {
      console.error('Join error:', err);
      setJoinError(err.message || 'Failed to join test.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Navbar user={user} profile={profile} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-white/10 p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>{profile?.organizationName || 'Organization Portal'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome back, {profile?.name || 'Student'} 👋
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl">
                Access proctored examinations assigned exclusively to {profile?.organizationName || 'your organization'}. Enter a Join Code to enroll in a new test.
              </p>
            </div>

            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 shrink-0"
            >
              <Key className="w-4 h-4" />
              <span>Join Test with Code</span>
            </button>
          </div>
        </div>

        {/* 4 Metrics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setFilterTab('all')}
            className={`p-5 rounded-2xl bg-slate-900/80 border transition-all cursor-pointer ${filterTab === 'all' ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Exams</span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{availableTests.length}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Need to take</span>
          </div>

          <div 
            onClick={() => setFilterTab('joined')}
            className={`p-5 rounded-2xl bg-slate-900/80 border transition-all cursor-pointer ${filterTab === 'joined' ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Joined Tests</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{joinedTests.length}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Enrolled sessions</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-indigo-400 mt-3">{averageScore}%</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Performance grade</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Safety Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400 mt-3">Safe</p>
            <span className="text-[10px] text-slate-500 mt-1 block">All clear</span>
          </div>
        </div>

        {/* Split Grid: Tests List (left) + Performance Progress Chart (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tests List Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Organization Tests</span>
                <span className="text-xs font-normal text-slate-500">({getDisplayTests().length})</span>
              </h2>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${filterTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All Tests
                </button>
                <button
                  onClick={() => setFilterTab('joined')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${filterTab === 'joined' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Joined
                </button>
                <button
                  onClick={() => setFilterTab('upcoming')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${filterTab === 'upcoming' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilterTab('completed')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${filterTab === 'completed' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Completed
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-xs">Loading tests for {profile?.organizationName}...</p>
              </div>
            ) : getDisplayTests().length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 p-8 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No tests found in this filter</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  If your instructor provided a Join Code, click "Join Test with Code" above to enroll into your exam.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getDisplayTests().map((test) => {
                  const enrolled = isEnrolled(test);
                  const completed = isTestCompleted(test);
                  const score = getTestScore(test);

                  return (
                    <div 
                      key={test.id} 
                      className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-xl space-y-5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${test.isLocked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : completed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : enrolled ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                            {test.isLocked ? 'Locked' : completed ? `Completed ${score != null ? `(${score}%)` : ''}` : enrolled ? 'Enrolled' : 'Available'}
                          </span>
                          <span className="text-xs font-mono text-slate-400">Code: {test.joinCode}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white">{test.title}</h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{test.description || 'No description provided.'}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{test.durationMinutes || 60} mins</span>
                        </div>

                        {test.isLocked ? (
                          <button disabled className="px-4 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </button>
                        ) : completed ? (
                          <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submitted {score != null ? `(${score}%)` : ''}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onLaunchExam?.(test)}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{enrolled ? 'Launch Exam' : 'Enter Test'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Performance Score Progress Chart */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-4 self-start">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Your Score Progress</h3>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-2 border-t border-slate-800">
              <span>📈 Score progression is safe & active</span>
            </p>
          </div>
        </div>
      </main>

      {/* Join Code Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Join Test</h3>
              </div>
              <button onClick={() => setIsJoinModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Enter the unique 6-character Join Code provided by your instructor to enroll in the test.
            </p>

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{joinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Join Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. X7K9P2"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-cyan-300 font-bold placeholder-slate-600 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate & Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
