import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Key, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Users, 
  Trash2, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Eye,
  FileText,
  BarChart2,
  BookOpen,
  Edit2,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  createTest, 
  fetchOrganizationTests, 
  toggleTestLock, 
  removeStudentFromTest,
  updateTest,
  deleteTest,
  fetchTestResultsByTestId,
  fetchLiveTelemetry
} from '../firebase';
import Navbar from './Navbar';
import AiTestGeneratorModal from './AiTestGeneratorModal';
import LiveMonitoringDashboard from './LiveMonitoringDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import CheatingReportModal from './CheatingReportModal';

export default function InstructorDashboard({ user, profile, onLogout }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'tests' | 'live_monitoring' | 'analytics'
  const [activeTab, setActiveTab] = useState('tests');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Roster Submissions & Cheating Report modal states
  const [rosterSubmissions, setRosterSubmissions] = useState([]);
  const [rosterTelemetry, setRosterTelemetry] = useState([]);
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [loadingRosterData, setLoadingRosterData] = useState(false);

  // Edit Test Modal state
  const [editingTest, setEditingTest] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editQuestions, setEditQuestions] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Manual Creation Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Copy Feedback
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  const loadTests = async () => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOrganizationTests(profile.organizationId);
      setTests(data);
    } catch (err) {
      console.error('Failed to load instructor tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
    const interval = setInterval(loadTests, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  // Load submissions and telemetry when selectedTest is opened
  useEffect(() => {
    async function loadRosterDetails() {
      if (!selectedTest?.id) return;
      setLoadingRosterData(true);
      try {
        const [submissions, telemetry] = await Promise.all([
          fetchTestResultsByTestId(selectedTest.id),
          fetchLiveTelemetry(selectedTest.id)
        ]);
        setRosterSubmissions(submissions || []);
        setRosterTelemetry(telemetry || []);
      } catch (e) {
        console.error('Error loading roster submissions:', e);
      } finally {
        setLoadingRosterData(false);
      }
    }
    loadRosterDetails();
  }, [selectedTest]);

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (!title.trim()) {
      setCreateError('Please enter a test title');
      return;
    }

    setCreating(true);
    try {
      await createTest({
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
        organizationId: profile.organizationId,
        createdBy: profile.uid,
        creatorName: profile.name
      });
      setTitle('');
      setDescription('');
      setIsCreateModalOpen(false);
      await loadTests();
    } catch (err) {
      console.error('Create test error:', err);
      setCreateError(err.message || 'Failed to create test.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (test) => {
    setEditingTest(test);
    setEditTitle(test.title || '');
    setEditDescription(test.description || '');
    setEditDuration(test.durationMinutes || 60);
    setEditQuestions(test.questions || []);
    setUpdateError(null);
  };

  const handleSaveEditedTest = async (e) => {
    e.preventDefault();
    if (!editingTest) return;
    setUpdateError(null);

    if (!editTitle.trim()) {
      setUpdateError('Test title cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      await updateTest(editingTest.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        durationMinutes: Number(editDuration) || 60,
        questions: editQuestions
      });
      setEditingTest(null);
      await loadTests();
    } catch (err) {
      console.error('Update test error:', err);
      setUpdateError(err.message || 'Failed to update test');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    try {
      await deleteTest(testId);
      await loadTests();
    } catch (err) {
      console.error('Delete test error:', err);
    }
  };

  const handleToggleLock = async (test) => {
    try {
      const newLockedState = !test.isLocked;
      await toggleTestLock(test.id, newLockedState);
      setTests(tests.map(t => t.id === test.id ? { ...t, isLocked: newLockedState } : t));
      if (selectedTest?.id === test.id) {
        setSelectedTest({ ...selectedTest, isLocked: newLockedState });
      }
    } catch (err) {
      console.error('Failed to toggle test lock:', err);
    }
  };

  const handleRemoveStudent = async (testId, studentId) => {
    try {
      await removeStudentFromTest(testId, studentId);
      const updatedEnrolled = (selectedTest?.enrolledStudents || []).filter(s => s.studentId !== studentId);
      setSelectedTest({ ...selectedTest, enrolledStudents: updatedEnrolled });
      setTests(tests.map(t => t.id === testId ? { ...t, enrolledStudents: updatedEnrolled } : t));
    } catch (err) {
      console.error('Failed to remove student:', err);
    }
  };

  const copyToClipboard = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } else {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  // Combine enrolled students with submitted results
  const allRosterStudents = (() => {
    if (!selectedTest) return [];
    const enrolled = selectedTest.enrolledStudents || [];
    const completed = selectedTest.completedStudents || [];
    const list = [...enrolled];

    completed.forEach(comp => {
      if (!list.some(s => s.studentId === comp.studentId)) {
        list.push({
          studentId: comp.studentId,
          name: comp.name || 'Student',
          email: comp.email || ''
        });
      }
    });

    // Add any student from rosterSubmissions who might not be in enrolled list
    rosterSubmissions.forEach(sub => {
      if (!list.some(s => s.studentId === sub.studentId)) {
        list.push({
          studentId: sub.studentId,
          name: sub.studentName || 'Student',
          email: sub.studentEmail || ''
        });
      }
    });

    return list.map(st => {
      const submission = rosterSubmissions.find(sub => sub.studentId === st.studentId);
      const completedDocEntry = completed.find(c => c.studentId === st.studentId);
      const telemetry = rosterTelemetry.find(tel => tel.studentId === st.studentId);
      const isSubmitted = !!submission || !!completedDocEntry;
      const score = submission ? submission.percentage : (completedDocEntry ? completedDocEntry.score : 0);

      return {
        ...st,
        isSubmitted,
        score,
        tabSwitches: submission ? submission.tabSwitches : (telemetry ? telemetry.tabSwitches : 0),
        violations: submission ? (submission.violations || []) : (telemetry ? (telemetry.violations || []) : []),
        submittedAt: submission ? submission.submittedAt : (completedDocEntry ? completedDocEntry.submittedAt : null),
        testTitle: selectedTest.title,
        testId: selectedTest.id
      };
    });
  })();

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950">
      <Navbar user={user} profile={profile} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Banner with Organization Info & Dual Creation Buttons */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-white/10 p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{profile?.organizationName || 'Organization'}</span>
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Instructor Console
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl">
                Create & edit AI-proctored tests, issue Join Codes, share invitation links, monitor live streams, and view AI cheating reports for {profile?.organizationName}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsAiGeneratorOpen(true)}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 shrink-0"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Generate Test with AI</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-bold text-xs transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Manually</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-semibold max-w-md">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'tests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Test Management</span>
          </button>
          <button
            onClick={() => setActiveTab('live_monitoring')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'live_monitoring' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Proctoring</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Tab Content 1: Managed Tests */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Managed Tests</span>
                <span className="text-xs font-normal text-slate-500">({tests.length})</span>
              </h2>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs">Loading tests for {profile?.organizationName}...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 p-8 space-y-4">
                <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No tests created yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Generate Test with AI" or "Create Manually" to create your first assessment with Join Codes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => {
                  const shareUrl = `${window.location.origin}/?join=${test.joinCode}`;
                  const allStudentsList = [
                    ...(test.enrolledStudents || []),
                    ...(test.completedStudents || [])
                  ];
                  const enrolledCount = new Set(allStudentsList.map(s => s.studentId)).size;

                  return (
                    <div 
                      key={test.id}
                      className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl space-y-5 relative group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${test.isLocked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {test.isLocked ? 'Locked' : 'Active'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(test)}
                              title="Edit / Update Test"
                              className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleToggleLock(test)}
                              title={test.isLocked ? 'Unlock Test' : 'Lock Test'}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${test.isLocked ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                            >
                              {test.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              <span>{test.isLocked ? 'Unlock' : 'Lock'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteTest(test.id)}
                              title="Delete Test"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white">{test.title}</h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{test.description || 'No description provided.'}</p>
                      </div>

                      {/* Join Code & Share Box */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Join Code</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-indigo-400 tracking-widest">{test.joinCode}</span>
                            <button
                              onClick={() => copyToClipboard(test.joinCode, 'code', test.id)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                              title="Copy Join Code"
                            >
                              {copiedCodeId === test.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Invite Link</span>
                          <button
                            onClick={() => copyToClipboard(shareUrl, 'link', test.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                          >
                            {copiedLinkId === test.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3" />
                                <span>Share Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Bottom Stats & Roster Action */}
                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{test.durationMinutes || 60} mins</span>
                        </div>

                        <button
                          onClick={() => setSelectedTest(test)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Students ({enrolledCount})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Live Proctoring Streams */}
        {activeTab === 'live_monitoring' && (
          <LiveMonitoringDashboard tests={tests} />
        )}

        {/* Tab Content 3: Analytics */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard tests={tests} />
        )}
      </main>

      {/* AI Test Generator Modal */}
      {isAiGeneratorOpen && (
        <AiTestGeneratorModal
          profile={profile}
          onClose={() => setIsAiGeneratorOpen(false)}
          onTestCreated={() => loadTests()}
        />
      )}

      {/* Manual Create Test Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Create Test Manually</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Test Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Computer Networks Exam"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Proctored via AI. Enforce full screen."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Update Assessment</h3>
              </div>
              <button onClick={() => setEditingTest(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditedTest} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Test Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  required
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Roster & Submissions Report Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Student Reports & Enrolled Roster</span>
                <h3 className="text-lg font-bold text-white">{selectedTest.title}</h3>
              </div>
              <button onClick={() => setSelectedTest(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Join Code</span>
                <p className="font-mono text-indigo-400 font-extrabold text-sm">{selectedTest.joinCode}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLock(selectedTest)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${selectedTest.isLocked ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {selectedTest.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{selectedTest.isLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingRosterData ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  <span className="text-xs">Fetching student submission reports...</span>
                </div>
              ) : allRosterStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No students have enrolled or submitted tests yet. Share Join Code (<strong className="text-indigo-400">{selectedTest.joinCode}</strong>) with your students.
                </div>
              ) : (
                allRosterStudents.map((st) => (
                  <div key={st.studentId} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">{st.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.isSubmitted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                          {st.isSubmitted ? `Submitted (${st.score}%)` : 'Enrolled / In Progress'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{st.email}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Tab Switches: <strong className={st.tabSwitches > 1 ? 'text-rose-400' : 'text-emerald-400'}>{st.tabSwitches}</strong></span>
                        <span>Anomalies: <strong className="text-amber-400">{st.violations?.length || 0}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStudentReport(st)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Cheating Report</span>
                      </button>

                      <button
                        onClick={() => handleRemoveStudent(selectedTest.id, st.studentId)}
                        title="Remove Student"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Cheating Report Modal */}
      {selectedStudentReport && (
        <CheatingReportModal
          candidate={selectedStudentReport}
          onClose={() => setSelectedStudentReport(null)}
        />
      )}
    </div>
  );
}
