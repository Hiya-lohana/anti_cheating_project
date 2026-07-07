import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getExams, getReports } from '../api';

const sectionContent = {
  'student-results': {
    title: 'Your Exam Results',
    description: 'See all your exam scores and results here.',
    summary: 'Your latest exam results are shown below.',
    callToAction: 'Take Another Exam',
    altText: 'Your exam scores and results'
  },
  'student-exams': {
    title: 'My Exams',
    description: 'Review every exam you have appeared for and how you performed.',
    summary: 'All completed exams are listed with scores and details.',
    callToAction: 'Start a New Exam',
    altText: 'All exams history'
  },
  'student-analytics': {
    title: 'Your Progress',
    description: 'Track how your scores are improving over time.',
    summary: 'See how you\'re doing in your exams.',
    callToAction: 'Take an Exam',
    altText: 'Your score progress and charts'
  },
  'student-calendar': {
    title: 'Exam Schedule',
    description: 'See when your exams are coming up.',
    summary: 'Your upcoming exams are shown below.',
    callToAction: 'Take Upcoming Exam',
    altText: 'Your exam dates and times'
  },
  'student-profile': {
    title: 'Your Profile',
    description: 'Update your name and email here.',
    summary: 'Your profile info is kept safe and secure.',
    callToAction: 'Update Profile',
    altText: 'Your student profile'
  },
  'student-settings': {
    title: 'Settings',
    description: 'Change your account settings and privacy options.',
    summary: 'Update your preferences here.',
    callToAction: 'Change Settings',
    altText: 'Your account settings'
  }
};

export default function StudentSection({ section, onNavigate, onLogout, activeTab, user }) {
  const config = sectionContent[section] || sectionContent['student-results'];
  const [examFilter, setExamFilter] = useState('All');
  const [exams, setExams] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const availableScheduledExams = exams.filter((exam) => exam.status === 'Scheduled');
  const hasScheduledExams = availableScheduledExams.length > 0;

  const userCompletedExams = React.useMemo(
    () => exams.filter((exam) => {
      if (exam.status !== 'Completed') return false;
      if (exam.score == null) return false;
      // allow completed records with or without examId; ignore demo fallback
      if (exam.examId === 'exam-demo') return false;
      if (exam.title?.toLowerCase()?.includes('demo exam')) return false;
      // match by email or studentName
      return exam.email === user?.email || exam.studentName === user?.name;
    }),
    [exams, user]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const examsData = await getExams();
        const reportsData = await getReports();
        setExams(examsData || []);
        setReports(reportsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const profileInfo = {
    Name: user?.name || user?.email?.split('@')[0] || 'Student',
    Email: user?.email || 'student@example.com',
    'Student ID': 'STU-2026-031',
    Course: 'B.Tech Computer Science',
    'Current Year': '3rd Year'
  };

  const filteredExams = useMemo(
    () => examFilter === 'All' ? userCompletedExams : userCompletedExams.filter((exam) => exam.integrity === examFilter),
    [examFilter, userCompletedExams]
  );

  const totalCompleted = userCompletedExams.length;
  const averageScore = userCompletedExams.length > 0 ? Math.round(userCompletedExams.reduce((sum, exam) => sum + (exam.score || 0), 0) / totalCompleted) : 0;
  const safeCount = userCompletedExams.filter((exam) => exam.integrity === 'Safe').length;
  const reviewCount = userCompletedExams.filter((exam) => exam.integrity === 'Review').length;
  const examSeries = userCompletedExams.length > 0 ? userCompletedExams.map((exam, index) => ({ name: `Exam ${index + 1}`, score: exam.score })) : [{ name: 'No data', score: 0 }];
  const settingsList = [
    { label: 'Email notifications', helpText: 'Receive exam updates and integrity alerts.', enabled: true },
    { label: 'Auto logout', helpText: 'Securely sign out after inactivity.', enabled: true },
    { label: 'Dark mode', helpText: 'Use the app in a low-light friendly theme.', enabled: true },
    { label: 'Report sharing', helpText: 'Allow instructors to share your exam summary.', enabled: true }
  ];
  const analyticsData = userCompletedExams.length > 0 ? userCompletedExams.map((exam, idx) => ({ name: `Exam ${idx + 1}`, score: exam.score })) : [{ name: 'No data', score: 0 }];

  return (
    <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{config.title}</h1>
            <p className="text-sm text-slate-400 mt-1">{config.description}</p>
          </div>
          <button
            onClick={() => hasScheduledExams && onNavigate?.('exam', { examId: availableScheduledExams[0].id })}
            disabled={!hasScheduledExams}
            className={`self-start sm:self-auto text-white font-bold text-sm px-6 py-3 rounded-xl transition-all ${hasScheduledExams ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 cursor-not-allowed'}`}
          >
            {hasScheduledExams ? config.callToAction : 'No Exams Available'}
          </button>
        </div>

        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{config.altText}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-2xl">
              <p className="text-sm text-slate-300 font-semibold">Summary</p>
              <p className="mt-3 text-white leading-relaxed">{config.summary}</p>
            </div>
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-2xl">
              <p className="text-sm text-slate-300 font-semibold">Next Step</p>
              <p className="mt-3 text-white leading-relaxed">Use the sidebar menu to explore other sections.</p>
            </div>
          </div>
        </div>

        {section === 'student-exams' && (
          <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">All Exams You Appeared For</h2>
                <p className="text-sm text-slate-400 mt-1">Filter the list by integrity status and review your performance at a glance.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', 'Safe', 'Review'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setExamFilter(option)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${examFilter === option ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl">
                <p className="text-sm text-slate-300 uppercase tracking-wide">Total Exams</p>
                <p className="text-3xl font-black text-white mt-3">{totalCompleted}</p>
              </div>
              <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl">
                <p className="text-sm text-slate-300 uppercase tracking-wide">Average Score</p>
                <p className="text-3xl font-black text-indigo-300 mt-3">{averageScore}%</p>
              </div>
              <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl">
                <p className="text-sm text-slate-300 uppercase tracking-wide">Safe Exams</p>
                <p className="text-3xl font-black text-emerald-400 mt-3">{safeCount}</p>
              </div>
            </div>

            <div className="grid gap-4">
              {loading ? (
                <p className="text-slate-400 py-8">Loading exams...</p>
              ) : filteredExams.length === 0 ? (
                <p className="text-slate-400 py-8">No exams have been completed yet.</p>
              ) : (
                filteredExams.map((exam, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#0b0f19] border border-slate-800 rounded-2xl">
                    <div className="md:col-span-2">
                      <p className="font-semibold text-white">{exam.title}</p>
                      <p className="text-xs text-slate-400 mt-2">{exam.date}</p>
                      <p className="text-xs text-slate-500 mt-1">{exam.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Score</p>
                      <p className="text-xl font-black text-white">{exam.score}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-300">Integrity</p>
                      <p className={`mt-2 font-bold ${exam.integrity === 'Safe' ? 'text-emerald-400' : 'text-amber-400'}`}>{exam.integrity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 bg-[#0b0f19] border border-slate-800 p-5 rounded-2xl">
              <p className="text-sm font-semibold text-slate-300 mb-4">Score Trend</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={examSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {section === 'student-analytics' && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-5">Score Trend</h2>
              {loading ? (
                <div className="h-72 w-full flex items-center justify-center text-slate-400">Loading data...</div>
              ) : exams.length === 0 ? (
                <div className="h-72 w-full flex items-center justify-center text-slate-400">No exam data available yet. Take some exams to see your progress.</div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                      <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-4">{exams.length === 0 ? 'Complete exams to see your progress trend.' : 'Your score trend shows steady improvement over the recent weeks.'}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
                <p className="text-xs uppercase tracking-widest text-slate-400">Top Score</p>
                <p className="text-4xl font-black text-white mt-4">{exams.length > 0 ? Math.max(...exams.map(e => e.score || 0)) + '%' : 'N/A'}</p>
                <p className="text-sm text-slate-400 mt-2">Highest exam performance</p>
              </div>
              <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
                <p className="text-xs uppercase tracking-widest text-slate-400">Average Score</p>
                <p className="text-4xl font-black text-indigo-300 mt-4">{averageScore}%</p>
                <p className="text-sm text-slate-400 mt-2">{exams.length === 0 ? 'Take exams to see your average' : 'Your average performance'}</p>
              </div>
              <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
                <p className="text-xs uppercase tracking-widest text-slate-400">Review Alerts</p>
                <p className="text-4xl font-black text-amber-400 mt-4">{reviewCount}</p>
                <p className="text-sm text-slate-400 mt-2">Exams flagged for review</p>
              </div>
            </div>
          </div>
        )}
        {section === 'student-calendar' && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-4">Upcoming Exam Schedule</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {loading ? (
                  <p className="text-slate-400">Loading schedule...</p>
                ) : exams.length === 0 ? (
                  <p className="text-slate-400">No upcoming exams scheduled.</p>
                ) : (
                  exams.map((exam, index) => (
                    <div key={index} className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-white">{exam.title}</p>
                      <p className="text-xs text-slate-400 mt-2">{exam.date || 'TBD'}</p>
                      <p className="text-xs text-slate-400 mt-1">{exam.duration || '60'} minutes</p>
                      <p className="text-xs text-amber-300 mt-3 font-semibold">Available</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-5">Calendar Notes</h2>
              <p className="text-sm text-slate-400">Stay prepared for each exam and review the integrity policies before entering the exam room.</p>
            </div>
          </div>
        )}
        {section === 'student-profile' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-6">Your Profile</h2>
              <div className="space-y-4">
                {Object.entries(profileInfo).map(([label, value]) => (
                  <div key={label} className="bg-[#0b0f19] rounded-2xl border border-slate-800 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-2 text-sm text-white font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-4">Security & Access</h2>
              <p className="text-sm text-slate-400">Your profile details are protected by secure authentication and end-to-end exam monitoring.</p>
              <button onClick={() => onNavigate?.('student-settings')} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all shadow-md">
                Update Account Settings
              </button>
            </div>
          </div>
        )}
        {section === 'student-settings' && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-5">Account Settings</h2>
              <div className="space-y-4">
                {settingsList.map((setting, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#0b0f19] p-4 rounded-2xl border border-slate-800 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{setting.label}</p>
                      <p className="text-xs text-slate-400 mt-1">{setting.helpText}</p>
                    </div>
                    <button className={`rounded-full px-4 py-2 text-xs font-semibold transition ${setting.enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      {setting.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-bold text-white mb-4">Privacy Controls</h2>
              <p className="text-sm text-slate-400">Control how your exam data is stored and reviewed by your institution.</p>
              <button className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all shadow-md">
                Review Privacy Policy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
