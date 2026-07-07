import React, { useState } from 'react';
import { createExam } from '../api';

const SUBJECT_OPTIONS = [
  'DSA',
  'DBMS',
  'AI',
  'CSS',
  'EHDF',
  'Operating Systems',
  'Software Engineering'
];

export default function ExamCreation({ onNavigate, onLogout, user }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    setIsSubmitting(true);
    setMessage('');

    if (!title.trim() || !description.trim() || !duration || duration <= 0) {
      setMessage('Title, description, and duration are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const exam = await createExam({
        title: title.trim(),
        subject,
        description: description.trim(),
        duration,
        security: ['Face Detection', 'Browser Lock', 'Audio Monitor'],
        createdBy: user?.email || user?.name || null
      });
      setMessage(`Created exam: ${exam.title}`);
      setTitle('');
      setSubject(SUBJECT_OPTIONS[0]);
      setDescription('');
      setDuration(60);
    } catch (error) {
      console.error('Create exam failed:', error);
      setMessage(error.message || 'Unable to create exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#0b0f19] overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Create Exam</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - Left side */}
        <div className="lg:col-span-2 bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Exam Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exam Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition">
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white h-20 focus:outline-none focus:border-indigo-500 transition resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duration (minutes)</label>
              <input value={duration} onChange={(e) => setDuration(Number(e.target.value))} type="number" className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <button onClick={handleCreate} disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md">
              {isSubmitting ? 'Creating...' : 'Create Exam'}
            </button>
            {message && <div className="text-sm text-slate-200 bg-slate-900/70 border border-slate-800 rounded-2xl p-3">{message}</div>}
          </div>
        </div>

        {/* Settings - Right side */}
        <div className="bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-bold text-white mb-4">Security Settings</h2>
          <div className="space-y-3">
            {['Face Detection', 'Browser Lock', 'Audio Monitor'].map((feature, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#0b0f19] rounded-xl border border-slate-800/60">
                <span className="text-sm text-slate-300 font-semibold">{feature}</span>
                <div className="w-10 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-md absolute right-0.5 top-0.5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}