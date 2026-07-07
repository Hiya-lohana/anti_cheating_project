import React, { useState, useEffect } from 'react';
import { getExams } from '../api';

export default function AdminDashboard({ onNavigate, onLogout }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeExams = exams.filter((exam) => ['Scheduled', 'Active'].includes(exam.status));
  const completedExams = exams.filter(
    (exam) =>
      exam.status === 'Completed' &&
      exam.score != null &&
      exam.examId !== 'exam-demo' &&
      !exam.title?.toLowerCase()?.includes('demo exam')
  );
  const averageScore = completedExams.length > 0 ? Math.round(completedExams.reduce((sum, exam) => sum + (exam.score || 0), 0) / completedExams.length) : 0;

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
    <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Exams</p>
          <p className="text-4xl font-black text-white mt-3">{activeExams.length}</p>
        </div>
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Exams</p>
          <p className="text-4xl font-black text-white mt-3">{completedExams.length}</p>
        </div>
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Violations Found</p>
          <p className="text-4xl font-black text-red-400 mt-3">0</p>
        </div>
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
          <p className="text-4xl font-black text-indigo-400 mt-3">{completedExams.length > 0 ? averageScore + '%' : 'N/A'}</p>
        </div>
      </div>

    </div>
  );
}