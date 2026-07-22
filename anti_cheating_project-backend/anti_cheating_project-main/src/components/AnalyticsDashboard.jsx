import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, ShieldAlert, Users, TrendingUp } from 'lucide-react';

export default function AnalyticsDashboard({ tests = [] }) {
  // Score Distribution Mock Data
  const scoreData = [
    { range: '90-100%', count: 12 },
    { range: '80-89%', count: 18 },
    { range: '70-79%', count: 9 },
    { range: '60-69%', count: 4 },
    { range: '<60%', count: 2 }
  ];

  const violationDistribution = [
    { name: 'Tab Switches', value: 45, color: '#f43f5e' },
    { name: 'Face Away', value: 25, color: '#fbbf24' },
    { name: 'Multiple Faces', value: 10, color: '#a855f7' },
    { name: 'Window Unfocus', value: 20, color: '#38bdf8' }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Assessments</span>
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{tests.length}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Active in organization</span>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Exam Score</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-3">84.2%</p>
          <span className="text-[10px] text-slate-500 mt-1 block">+3.1% vs last month</span>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {tests.reduce((acc, t) => acc + (t.enrolledStudents?.length || 0), 0)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Verified students</span>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Integrity Index</span>
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-cyan-400 mt-3">96.8%</p>
          <span className="text-[10px] text-slate-500 mt-1 block">AI verified clean sessions</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Score Distribution Spectrum</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violation Breakdown Pie Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Proctoring Anomaly Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {violationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
