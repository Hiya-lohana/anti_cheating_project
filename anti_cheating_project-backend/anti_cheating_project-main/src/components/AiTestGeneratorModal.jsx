import React, { useState } from 'react';
import { Sparkles, RefreshCw, Check, Trash2, Edit2, Loader2, AlertCircle, Save, Plus } from 'lucide-react';
import { generateTestWithAI, regenerateQuestionWithAI } from '../services/geminiService';
import { createTest } from '../firebase';

export default function AiTestGeneratorModal({ profile, onClose, onTestCreated }) {
  const [step, setStep] = useState('input'); // 'input' | 'preview'
  
  // Inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState('Mixed');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // AI Output
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [testTitle, setTestTitle] = useState('');

  // Loading & State
  const [generating, setGenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !topic.trim()) {
      setError('Please provide both Subject and Topic');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateTestWithAI({
        subject: subject.trim(),
        topic: topic.trim(),
        description: description.trim(),
        difficulty,
        numQuestions: Number(numQuestions),
        questionType,
        durationMinutes: Number(durationMinutes)
      });

      setTestTitle(result.title || `${subject}: ${topic}`);
      setGeneratedQuestions(result.questions || []);
      setStep('preview');
    } catch (err) {
      console.error('AI Generation Error:', err);
      setError(err.message || 'Failed to generate assessment. Please try again.');
    } font: {
      setGenerating(false);
    }
  };

  const handleRegenerateQuestion = async (index) => {
    setRegeneratingIndex(index);
    try {
      const newQuestion = await regenerateQuestionWithAI({
        subject,
        topic,
        difficulty,
        questionIndex: index
      });
      const updated = [...generatedQuestions];
      updated[index] = newQuestion;
      setGeneratedQuestions(updated);
    } catch (err) {
      console.error('Question regeneration failed:', err);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...generatedQuestions];
    updated[index][field] = value;
    setGeneratedQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...generatedQuestions];
    updated[qIndex].options[oIndex] = value;
    setGeneratedQuestions(updated);
  };

  const handleSaveToFirebase = async () => {
    setSaving(true);
    try {
      const createdTest = await createTest({
        title: testTitle,
        description: description || `AI-generated test on ${topic}`,
        durationMinutes: Number(durationMinutes),
        organizationId: profile.organizationId,
        createdBy: profile.uid,
        creatorName: profile.name,
        questions: generatedQuestions
      });

      onTestCreated?.(createdTest);
      onClose();
    } catch (err) {
      console.error('Failed to save AI test:', err);
      setError(err.message || 'Failed to publish assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Test Generator</h2>
              <p className="text-xs text-slate-400">Powered by Google Gemini Assessment Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">✕</button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Generator Input Form */}
        {step === 'input' && (
          <form onSubmit={handleGenerateAI} className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Operating Systems & Process Scheduling"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assessment Description & Instructions</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Focus on round-robin algorithms, deadlock conditions, and memory page replacement."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Questions Count</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Question Format</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Mixed">Mixed Types</option>
                  <option value="MCQ">MCQ (4 Options)</option>
                  <option value="True/False">True / False</option>
                  <option value="Short Answer">Short Answer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is generating questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Assessment with AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Interactive Review & Editor */}
        {step === 'preview' && (
          <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400">Generated Title</span>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-transparent text-base font-bold text-white focus:outline-none border-b border-cyan-500/30 mt-0.5"
                />
              </div>
              <button
                onClick={() => setStep('input')}
                className="text-xs text-slate-400 hover:text-white underline font-medium"
              >
                Change Parameters
              </button>
            </div>

            {/* Questions Editor List */}
            <div className="space-y-4">
              {generatedQuestions.map((q, idx) => (
                <div key={q.id || idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Question {idx + 1} ({q.type || 'MCQ'})
                    </span>

                    <button
                      type="button"
                      disabled={regeneratingIndex === idx}
                      onClick={() => handleRegenerateQuestion(idx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
                      title="Regenerate this specific question with AI"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regeneratingIndex === idx ? 'animate-spin' : ''}`} />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                  />

                  {/* Options List */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${idx}`}
                            checked={q.correctAnswerIndex === oIdx}
                            onChange={() => handleQuestionChange(idx, 'correctAnswerIndex', oIdx)}
                            className="accent-cyan-400 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                            className={`w-full bg-slate-950 border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none ${q.correctAnswerIndex === oIdx ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800'}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Answer Explanation</label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
              >
                Back to Settings
              </button>

              <button
                onClick={handleSaveToFirebase}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Assessment...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publish Assessment to Organization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
