const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'API request failed.');
  }

  return body;
}

export const login = (payload) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const getExams = () => request('/exams');

export const getExam = async (id) => {
  try {
    return await request(`/exams/${id}`);
  } catch (err) {
    const exams = await getExams();
    const matched = (exams || []).find((exam) => exam.id === id);
    if (matched) {
      return matched;
    }
    throw err;
  }
};

export const createExam = (payload) => request('/exams', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const submitExamResult = (payload) => request('/exams/complete', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const getReports = () => request('/reports');

export const createReport = (payload) => request('/reports', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const startProctorSession = (examId) => request('/proctor/start', {
  method: 'POST',
  body: JSON.stringify({ examId })
});
