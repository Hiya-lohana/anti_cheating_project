import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { createReport, submitExamResult, getExam } from '../api';

const SUBJECT_KEY_MAP = {
  'dsa': 'Data Structures and Algorithms',
  'data structures and algorithms': 'Data Structures and Algorithms',
  'dbms': 'DBMS',
  'database systems': 'DBMS',
  'ai': 'AI',
  'artificial intelligence': 'AI',
  'css': 'CSS',
  'ehdf': 'EHDF',
  'operating systems': 'Operating Systems',
  'software engineering': 'Software Engineering'
};

function normalizeSubject(subject = '', title = '', description = '') {
  const rawSubject = (subject || '').trim().toLowerCase();
  if (rawSubject && SUBJECT_KEY_MAP[rawSubject]) {
    return SUBJECT_KEY_MAP[rawSubject];
  }

  const combined = `${subject || ''} ${title || ''} ${description || ''}`.trim().toLowerCase();
  if (!combined) return 'Data Structures and Algorithms';
  if (/\b(dbms|database)\b/.test(combined)) return 'DBMS';
  if (/\b(artificial intelligence|ai)\b/.test(combined)) return 'AI';
  if (/\bcss\b/.test(combined)) return 'CSS';
  if (/\behdf\b/.test(combined)) return 'EHDF';
  if (/\b(operating systems|operating system|os)\b/.test(combined)) return 'Operating Systems';
  if (/\bsoftware engineering\b/.test(combined)) return 'Software Engineering';
  if (/\b(data structures|algorithms|dsa)\b/.test(combined)) return 'Data Structures and Algorithms';
  return 'Data Structures and Algorithms';
}

const QUESTION_BANKS = {
  'Data Structures and Algorithms': [
    'Which of the following data structures is best for implementing depth-first search?',
    'What is the time complexity of heap sort in average case?',
    'Which of these traversals is commonly used for binary search tree sorting?',
    'Which data structure provides O(1) average time complexity for lookup operations?',
    'What is the main advantage of using a balanced tree like AVL or Red-Black tree?'
  ],
  'Operating Systems': [
    'What is the role of a process scheduler in an operating system?',
    'Which memory management technique allows non-contiguous allocation?',
    'What does a context switch involve?',
    'Which strategy is used to prevent deadlocks in operating systems?',
    'What is a page fault and how does the OS handle it?'
  ],
  'DBMS': [
    'Which normal form eliminates repeating groups in a relational schema?',
    'What is the difference between clustered and non-clustered indexes?',
    'Which SQL statement is used to combine rows from two tables based on a related column?',
    'What does ACID stand for in database transactions?',
    'Which isolation level may allow dirty reads?'
  ],
  'Computer Networks': [
    'Which protocol is responsible for reliable, ordered delivery of packets?',
    'What is the primary purpose of the TCP three-way handshake?',
    'Which layer of the OSI model handles routing between networks?',
    'What does the term bandwidth refer to in networking?',
    'Which technology is used for wireless local area networking?'
  ],
  'Software Engineering': [
    'What is the main goal of agile software development?',
    'Which UML diagram shows class hierarchy and relationships?',
    'What is test-driven development (TDD)?',
    'Which design pattern is used to create families of related objects?',
    'What is continuous integration in software engineering?'
  ],
  'Artificial Intelligence': [
    'What type of learning involves labeled training data?',
    'Which algorithm is commonly used for classification problems?',
    'What is the purpose of a loss function in machine learning?',
    'Which concept is central to neural networks and deep learning?',
    'What is the goal of reinforcement learning?'
  ],
  'AI': [
    'What type of learning involves labeled training data?',
    'Which algorithm is commonly used for classification problems?',
    'What is the purpose of a loss function in machine learning?',
    'Which concept is central to neural networks and deep learning?',
    'What is the goal of reinforcement learning?'
  ],
  'CSS': [
    'What does CSS stand for in web development?',
    'Which property is used to change the font size of text in CSS?',
    'How do you create a flex container in CSS?',
    'What is the difference between margin and padding?',
    'Which CSS selector targets an element by its ID?'
  ],
  'EHDF': [
    'What is the primary purpose of EHDF in digital fabrication?',
    'Which material property is most important for EHDF structural elements?',
    'How does EHDF compare to MDF in terms of moisture resistance?',
    'What type of joint is commonly used in EHDF furniture construction?',
    'Which finishing technique is best for EHDF surfaces?'
  ]
};

export default function ExamInterface({ onNavigate, user, examId }) {
  const totalQuestions = 20;
  const [exam, setExam] = useState(null);
  const [examLoading, setExamLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraConnected, setCameraConnected] = useState(false);

  const examTitle = exam?.title || 'Exam';
  const normalizedSubject = exam ? normalizeSubject(exam.subject, exam.title, exam.description) : 'Data Structures and Algorithms';
  const examSubject = normalizedSubject;
  const questions = exam ? QUESTION_BANKS[normalizedSubject] || QUESTION_BANKS['Data Structures and Algorithms'] : [];
  const currentQuestion = questions.length ? questions[qIndex % questions.length] : 'Loading exam questions…';

  const handleNext = () => {
    if (qIndex < totalQuestions - 1) {
      setQIndex(qIndex + 1);
      return;
    }
    // reached last question -> finish exam
    setFinished(true);
  };

  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    if (!finished || reportSubmitted || !examId) return;

    const submitReport = async () => {
      try {
        // compute a demo score (placeholder - replace with real scoring)
        const computedScore = Math.min(100, Math.max(0, Math.floor(Math.random() * 41) + 60)); // 60-100
        const incidents = Math.floor(Math.random() * 3);

        const payload = {
          examId,
          studentName: user?.name || 'Student',
          email: user?.email || 'student@institution.edu',
          incidentCount: incidents,
          summary: `Auto-generated report after ${totalQuestions} questions. Score: ${computedScore}%`,
          score: computedScore,
          status: 'Closed'
        };

        await createReport(payload);
        // also record a completed exam entry so the student can see results
        await submitExamResult({
          examId,
          title: examTitle,
          date: new Date().toLocaleString(),
          score: computedScore,
          integrity: incidents > 2 ? 'Review' : 'Safe',
          status: 'Completed',
          studentName: user?.name || 'Student',
          email: user?.email || 'student@institution.edu'
        });
        setReportSubmitted(true);
      } catch (err) {
        console.error('Failed to submit report:', err);
      }
    };

    submitReport();
  }, [finished, reportSubmitted, user, examId]);

  useEffect(() => {
    // start timer
    if (finished) return;
    const t = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  useEffect(() => {
    // fetch the exam metadata so the interface reflects the selected subject
    const loadExam = async () => {
      setExamLoading(true);
      try {
        const examData = await getExam(examId);
        setExam(examData);
      } catch (err) {
        console.error('Failed to load exam:', err);
        setExam(null);
      } finally {
        setExamLoading(false);
      }
    };

    if (examId) loadExam();

    // start webcam stream when component mounts and until exam finished
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setCameraConnected(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        // ignore permission errors; camera will show disconnected state
        console.warn('Camera start failed', err);
        setCameraConnected(false);
      }
    };

    if (!finished && examId) startCamera();

    return () => {
      // stop camera on unmount or when finished
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraConnected(false);
    };
  }, [finished, examId]);

  if (!examId) {
    return (
      <div className="w-full min-h-screen bg-[#0b0f19] flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full bg-[#111c44] border border-slate-800/70 rounded-3xl p-10 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">No exam selected</h2>
          <p className="text-sm text-slate-400 mb-8">Please go back to the dashboard and choose a scheduled exam before starting.</p>
          <button onClick={() => onNavigate?.('student')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (examLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0b0f19] flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full bg-[#111c44] border border-slate-800/70 rounded-3xl p-10 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Loading exam...</h2>
          <p className="text-sm text-slate-400">Fetching the exam subject and details for your session.</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="w-full min-h-screen bg-[#0b0f19] flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full bg-[#111c44] border border-slate-800/70 rounded-3xl p-10 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Exam not found</h2>
          <p className="text-sm text-slate-400 mb-8">We could not retrieve the selected exam details. Please try again.</p>
          <button onClick={() => onNavigate?.('student')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#0b0f19] flex flex-col">
      {/* Top Status Header */}
      <div className="bg-[#111c44] border-b border-slate-800/60 px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">{examTitle}</h2>
          <p className="text-sm text-slate-300">Subject: {examSubject}</p>
          <p className="text-xs text-slate-400 mt-0.5">Question {qIndex + 1} of {totalQuestions}</p>
        </div>
        <div className="bg-[#0b0f19] border border-indigo-500/60 px-6 py-2 rounded-xl font-mono text-2xl font-black text-indigo-400 tracking-widest">
          {new Date(elapsedSeconds * 1000).toISOString().substr(11, 8)}
        </div>
      </div>

      {/* Main Content: Question (left) + Webcam (right) */}
      <div className="flex-1 flex p-6 gap-6">
        {/* Question Block - Left side */}
        <div className="flex-1 bg-[#111c44] border border-slate-800/60 p-8 rounded-2xl shadow-md">
          <div className="mb-6">
            <span className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Multiple Choice Question</span>
            <p className="text-xs text-slate-400 mt-0.5">Question {qIndex + 1} of {totalQuestions}</p>
            <h3 className="text-lg font-bold text-white mt-3 leading-relaxed">
              {currentQuestion}
            </h3>
          </div>

          <div className="space-y-3 mb-8">
            {[
              'Option A: Sequential Queue Stream',
              'Option B: Inverted Stack Matrix',
              'Option C: Linear Indirection Array',
              'Option D: Bidirectional Linked Pointer Array'
            ].map((option, idx) => (
              <label key={idx} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${idx === 1 ? 'bg-indigo-600/10 border-indigo-500' : 'bg-[#0b0f19] border-slate-800/80 hover:border-slate-700'}`}>
                <input type="radio" name="answer" defaultChecked={idx === 1} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-medium text-slate-200">{option}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-800/40">
            <button className="flex-1 border border-slate-700 bg-slate-800/40 px-5 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-all">
              Save Progress
            </button>
            <button onClick={handleNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md">
              Next Question
            </button>
          </div>
        </div>

        {/* Exam Status Panel - Right side */}
        <div className="w-72 bg-[#111c44] border border-slate-800/60 p-6 rounded-2xl shadow-md flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Exam Status</span>
          <div className="relative flex-1 bg-[#0b0f19] rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-700/70">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {!cameraConnected && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Camera size={40} className="text-slate-500/40" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-slate-800/80 text-[10px] px-2.5 py-1 rounded-full font-black text-slate-200 tracking-wider uppercase">
              {cameraConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="mt-4 bg-[#0b0f19] border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400">Session</span>
            <span className={`${finished ? 'text-slate-400' : 'text-emerald-400'}`}>{finished ? 'Ended' : 'Live ✓'}</span>
          </div>
            <div className="mt-3 bg-[#0b0f19] border border-slate-800 p-3 rounded-xl text-center font-mono text-2xl font-black text-indigo-400">
              {new Date(elapsedSeconds * 1000).toISOString().substr(11, 8)}
            </div>
        </div>
      </div>

      {finished && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-[#0b111a] p-8 rounded-2xl border border-slate-800/60">
            <h2 className="text-2xl font-bold mb-4">Exam Finished</h2>
            <p className="text-slate-300 mb-6">You have completed all {totalQuestions} questions. Your session time: {new Date(elapsedSeconds * 1000).toISOString().substr(11, 8)}.</p>
            <div className="flex gap-3">
              <button onClick={() => onNavigate?.('report')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl text-sm font-bold text-white">View Report</button>
              <button onClick={() => onNavigate?.('landing')} className="flex-1 border border-slate-700 px-5 py-3 rounded-xl text-sm font-bold text-slate-200">Return Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}