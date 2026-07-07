import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getExams } from '../api';

export default function StudentDashboard({ onNavigate, onLogout, user }) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'Student';
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const completedExams = exams.filter(
    (exam) =>
      exam.status === 'Completed' &&
      exam.score != null &&
      exam.examId !== 'exam-demo' &&
      !exam.title?.toLowerCase()?.includes('demo exam') &&
      (exam.email === user?.email || exam.studentName === user?.name)
  );
  const completedExamIds = completedExams.map((exam) => exam.examId).filter(Boolean);
  const availableExams = exams.filter(
    (exam) =>
      exam.status === 'Scheduled' &&
      !completedExamIds.includes(exam.id)
  );
  const averageScore = completedExams.length > 0 ? Math.round(completedExams.reduce((sum, r) => sum + (r.score || 0), 0) / completedExams.length) : 0;
  const performanceData = completedExams.length > 0 ? completedExams.map((r, idx) => ({ name: `Exam ${idx + 1}`, score: r.score || 0 })) : [{ name: 'No data', score: 0 }];

  useEffect(() => {
    async function fetchData() {
      try {
        const examsData = await getExams();
        setExams(examsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f19] p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Welcome Back, {displayName}! 👋</h1>
        <p className="text-sm text-slate-400 mt-1">Check your exams and scores here.</p>
      </div>

      {/* 4 Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Exams</p>
          <p className="text-4xl font-black text-white mt-3">{availableExams.length}</p>
          <span className="text-[10px] text-slate-400 block mt-2 font-medium">Need to take</span>
        </div>
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Exams</p>
          <p className="text-4xl font-black text-white mt-3">{completedExams.length}</p>
          <span className="text-[10px] text-slate-400 block mt-2 font-medium">All done</span>
        </div>
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
          <p className="text-4xl font-black text-indigo-400 mt-3">{completedExams.length > 0 ? averageScore + '%' : 'N/A'}</p>
          <span className="text-[10px] text-slate-400 block mt-2 font-medium">{completedExams.length === 0 ? 'Complete an exam' : 'Good!'}</span>
        </div>
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Safety Status</p>
          <p className="text-4xl font-black text-emerald-400 mt-3">Safe</p>
          <span className="text-[10px] text-slate-400 block mt-2 font-medium">All clear</span>
        </div>
      </div>

      {/* Split Grid: Upcoming Exams (left) + Performance Chart (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Exams - Only show exams the current student has not completed */}
        {!loading && availableExams.length > 0 && (
          <div className="lg:col-span-2 bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-white mb-5">Your Upcoming Exams</h2>
            <div className="space-y-4">
              {availableExams.map((exam) => (
                <div key={exam.id} className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white text-sm">{exam.title}</p>
                    <p className="text-xs text-slate-400 mt-2">{exam.description}</p>
                  </div>
                  <button onClick={() => onNavigate?.('exam', { examId: exam.id })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all whitespace-nowrap ml-4">Launch</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Chart */}
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-bold text-white mb-4">Your Score Progress</h2>
          {loading ? (
            <div className="h-40 w-full flex items-center justify-center text-slate-400">Loading...</div>
          ) : completedExams.length === 0 ? (
            <div className="h-40 w-full flex items-center justify-center text-slate-400">Complete exams to see your progress</div>
          ) : (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-emerald-400 font-semibold mt-3">{completedExams.length > 0 ? '📈 Track your improvement' : '📝 Start taking exams'}</p>
        </div>
      </div>
    </div>
  );
}