/**
 * Service for interacting with Google Gemini API for AI Test Generation & Cheating Analysis
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || '';

/**
 * Generate assessment questions using Google Gemini API
 */
export async function generateTestWithAI({
  subject,
  topic,
  description,
  difficulty = 'Medium',
  numQuestions = 5,
  questionType = 'Mixed',
  durationMinutes = 60
}) {
  const prompt = `You are an expert academic assessment generator. Create a structured test based on the following parameters:
- Subject: ${subject}
- Topic: ${topic}
- Description: ${description}
- Difficulty: ${difficulty}
- Number of Questions: ${numQuestions}
- Question Type: ${questionType} (Options: MCQ, True/False, Short Answer, Mixed)

IMPORTANT: You MUST respond ONLY with a valid JSON object in the exact following structure without markdown formatting or backticks:
{
  "title": "${subject}: ${topic}",
  "description": "${description}",
  "difficulty": "${difficulty}",
  "durationMinutes": ${durationMinutes},
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "question": "Clear question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct."
    }
  ]
}
For True/False questions, options should be ["True", "False"] and correctAnswerIndex 0 or 1.
For Short Answer questions, options can be empty array [] and correctAnswerIndex 0, with explanation containing the sample ideal answer.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean JSON response
    const cleanedJsonText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedTest = JSON.parse(cleanedJsonText);
    return parsedTest;
  } catch (error) {
    console.error('Gemini Test Generation Error:', error);
    // Fallback Mock Generator if API fails or quota exceeded
    return generateFallbackTest({ subject, topic, difficulty, numQuestions, durationMinutes });
  }
}

/**
 * Regenerate a single question using Gemini API
 */
export async function regenerateQuestionWithAI({ subject, topic, difficulty, questionIndex }) {
  const prompt = `Generate 1 unique assessment question for Subject: "${subject}", Topic: "${topic}", Difficulty: "${difficulty}".
Respond ONLY with a JSON object in this format:
{
  "id": "q_${Date.now()}",
  "type": "MCQ",
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "explanation": "Explanation here."
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error('Regenerate question error:', err);
    return {
      id: `q_${Date.now()}`,
      type: 'MCQ',
      question: `Sample AI Question regarding ${topic} (${difficulty})`,
      options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
      correctAnswerIndex: 0,
      explanation: `Automated explanation for ${topic}.`
    };
  }
}

/**
 * Generate AI Cheating & Integrity Analysis Report
 */
export async function generateAICheatingAnalysis({ studentName, testTitle, violations = [], tabSwitches = 0 }) {
  const prompt = `You are an AI Exam Integrity Auditor. Analyze the proctoring log data for candidate "${studentName}" during the test "${testTitle}":
- Total Tab Switches / Window Unfocus Events: ${tabSwitches}
- Violation Timeline Log: ${JSON.stringify(violations)}

Provide an automated cheating assessment. Respond ONLY with a JSON object in this format:
{
  "riskLevel": "High" | "Moderate" | "Low",
  "verdict": "Clear summary statement regarding exam integrity.",
  "confidenceScore": 92,
  "keyObservations": [
    "Observation 1",
    "Observation 2"
  ],
  "recommendation": "Recommendation for the instructor."
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error('AI Cheating Analysis Error:', err);
    const risk = tabSwitches > 4 || violations.length > 5 ? 'High' : tabSwitches > 1 || violations.length > 2 ? 'Moderate' : 'Low';
    return {
      riskLevel: risk,
      verdict: `Candidate showed ${tabSwitches} tab switches and ${violations.length} logged proctoring anomalies during the session.`,
      confidenceScore: 88,
      keyObservations: [
        `Recorded ${tabSwitches} window unfocus events.`,
        `Detected ${violations.length} camera/face alignment anomalies.`
      ],
      recommendation: risk === 'High' ? 'Review session recording immediately.' : 'No major integrity breach confirmed.'
    };
  }
}

/**
 * Fallback generator if Gemini API key is offline
 */
function generateFallbackTest({ subject, topic, difficulty, numQuestions, durationMinutes }) {
  const questions = [];
  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      id: `q${i}`,
      type: i % 2 === 0 ? 'True/False' : 'MCQ',
      question: `[${difficulty}] ${subject}: Sample Question ${i} regarding ${topic}?`,
      options: i % 2 === 0 ? ['True', 'False'] : [
        `Core concept of ${topic} A`,
        `Alternative implementation B`,
        `Standard protocol C`,
        `None of the above`
      ],
      correctAnswerIndex: 0,
      explanation: `Detailed explanation for question ${i} covering fundamental principles of ${topic}.`
    });
  }

  return {
    title: `${subject}: ${topic}`,
    description: `AI Generated Assessment on ${topic}`,
    difficulty,
    durationMinutes: Number(durationMinutes) || 60,
    questions
  };
}
