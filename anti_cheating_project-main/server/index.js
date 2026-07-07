import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGO_DB_NAME || 'proctorAi';

const mongoClient = new MongoClient(mongoUri, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true
  }
});

let examsCollection;
let reportsCollection;
let dbAvailable = false;
const inMemoryExams = [];
const inMemoryReports = [];

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const SUBJECT_NORMALIZER = {
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
  if (rawSubject) {
    const normalized = SUBJECT_NORMALIZER[rawSubject];
    if (normalized) return normalized;
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

function validatePin(role, pin) {
  return role === 'teacher' ? pin === '4321' : pin === '1234';
}

app.post('/api/auth/login', (req, res) => {
  const { role, email, pin, name } = req.body;

  if (!role || !email || !pin) {
    return res.status(400).json({ error: 'Email, PIN, and role are required.' });
  }

  if (!validatePin(role, pin)) {
    return res.status(401).json({ error: 'Invalid access PIN. Use 1234 for students or 4321 for instructors.' });
  }

  return res.json({
    id: `user-${Date.now()}`,
    role,
    name: name || (role === 'teacher' ? 'Instructor' : 'Student'),
    email,
    token: `demo-token-${Date.now()}`
  });
});

app.get('/api/exams', async (req, res) => {
  try {
    if (dbAvailable) {
      const exams = await examsCollection.find().toArray();
      return res.json(exams.map((exam) => ({
        ...exam,
        subject: normalizeSubject(exam.subject, exam.title, exam.description)
      })));
    }

    return res.json(inMemoryExams.map((exam) => ({
      ...exam,
      subject: normalizeSubject(exam.subject, exam.title, exam.description)
    })));
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    return res.status(500).json({ error: 'Failed to fetch exams.' });
  }
});

app.get('/api/exams/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let exam;
    if (dbAvailable) {
      exam = await examsCollection.findOne({ id });
    } else {
      exam = inMemoryExams.find((entry) => entry.id === id);
    }

    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    return res.json({
      ...exam,
      subject: normalizeSubject(exam.subject, exam.title, exam.description)
    });
  } catch (error) {
    console.error('Failed to fetch exam:', error);
    return res.status(500).json({ error: 'Failed to fetch exam.' });
  }
});

app.post('/api/exams', async (req, res) => {
  const { title, description, duration, security, createdBy, subject } = req.body;
  const normalizedSubject = normalizeSubject(subject, title, description);

  if (!title || !description || !duration) {
    return res.status(400).json({ error: 'Title, description, and duration are required.' });
  }

  const newExam = {
    id: `exam-${Date.now()}`,
    title,
    description,
    subject: normalizedSubject,
    duration,
    security: security || ['Face Detection', 'Browser Lock', 'Audio Monitor'],
    status: 'Scheduled',
    createdAt: new Date(),
    createdBy: createdBy || null
  };

  try {
    if (dbAvailable) {
      const result = await examsCollection.insertOne(newExam);
      return res.status(201).json({ ...newExam, _id: result.insertedId });
    }

    inMemoryExams.push(newExam);
    return res.status(201).json(newExam);
  } catch (error) {
    console.error('Failed to create exam:', error);
    return res.status(500).json({ error: 'Failed to create exam.' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    if (dbAvailable) {
      const reports = await reportsCollection.find().toArray();
      return res.json(reports);
    }

    return res.json(inMemoryReports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

app.post('/api/reports', async (req, res) => {
  const { examId, studentName, email, incidentCount = 0, summary = '', score = null, status = 'Active' } = req.body;

  if (!examId || !studentName || !email) {
    return res.status(400).json({ error: 'examId, studentName and email are required to create a report.' });
  }

  const newReport = {
    id: `report-${Date.now()}`,
    examId,
    studentName,
    email,
    incidentCount,
    summary,
    score,
    status,
    createdAt: new Date()
  };

  try {
    if (dbAvailable) {
      const result = await reportsCollection.insertOne(newReport);
      return res.status(201).json({ ...newReport, _id: result.insertedId });
    }

    inMemoryReports.push(newReport);
    return res.status(201).json(newReport);
  } catch (error) {
    console.error('Failed to create report:', error);
    return res.status(500).json({ error: 'Failed to create report.' });
  }
});

app.post('/api/proctor/start', async (req, res) => {
  let { examId } = req.body;

  try {
    let exam = null;
    if (examId) {
      if (dbAvailable) {
        exam = await examsCollection.findOne({ id: examId });
      } else {
        exam = inMemoryExams.find((item) => item.id === examId) || null;
      }
    }

    if (!exam) {
      if (dbAvailable) {
        exam = await examsCollection.findOne();
      } else {
        exam = inMemoryExams[0] || null;
      }

      if (exam) {
        examId = exam.id;
      } else {
        examId = examId || 'exam-demo';
      }
    }

    const response = {
      sessionId: `session-${Date.now()}`,
      examId,
      status: 'active'
    };

    if (!exam) {
      response.warning = 'No exam was found in storage. Using a demo session fallback.';
    }

    return res.json(response);
  } catch (error) {
    console.error('Failed to start proctor session:', error);
    return res.status(500).json({ error: 'Failed to start proctor session.' });
  }
});

app.post('/api/exams/complete', async (req, res) => {
  const { examId = null, title, date, score = null, integrity = 'Safe', status = 'Completed', studentName = '', email = '' } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'title and date are required to record a completed exam.' });
  }

  const completed = {
    id: `exam-result-${Date.now()}`,
    examId,
    title,
    date,
    score,
    integrity,
    status,
    studentName,
    email,
    createdAt: new Date()
  };

  try {
    if (dbAvailable) {
      const result = await examsCollection.insertOne(completed);
      return res.status(201).json({ ...completed, _id: result.insertedId });
    }

    inMemoryExams.push(completed);
    return res.status(201).json(completed);
  } catch (error) {
    console.error('Failed to record completed exam:', error);
    return res.status(500).json({ error: 'Failed to record completed exam.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

async function initializeDatabase() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db(mongoDbName);
    examsCollection = db.collection('exams');
    reportsCollection = db.collection('reports');
    dbAvailable = true;

    const examCount = await examsCollection.countDocuments();
    if (examCount === 0) {
      // Database starts empty - seed data removed
    }

    const reportCount = await reportsCollection.countDocuments();
    if (reportCount === 0) {
      // Database starts empty - seed data removed
    }
  } catch (error) {
    console.error('MongoDB initialization failed:', error);
    console.warn('Continuing in-memory mode without MongoDB. API routes will still work for demo flows.');
    dbAvailable = false;
  }
}

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend API listening at http://localhost:${port}`);
    if (dbAvailable) {
      console.log(`Connected to MongoDB at ${mongoUri}`);
    } else {
      console.log('Running without MongoDB. Using in-memory storage.');
    }
  });
});
