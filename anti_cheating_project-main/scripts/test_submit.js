(async () => {
  try {
    const base = 'http://localhost:4000/api';

    const reportPayload = {
      examId: 'exam-demo',
      studentName: 'Automated Tester',
      email: 'tester@example.com',
      incidentCount: 1,
      summary: 'Automated test report',
      score: 85
    };

    const reportRes = await fetch(`${base}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });
    console.log('createReport status', reportRes.status);
    console.log(await reportRes.json());

    const examPayload = {
      title: 'Automated Demo Exam',
      date: new Date().toLocaleString(),
      score: 85,
      integrity: 'Safe',
      status: 'Completed'
    };

    const examRes = await fetch(`${base}/exams/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examPayload)
    });
    console.log('completeExam status', examRes.status);
    console.log(await examRes.json());

    const reportsList = await fetch(`${base}/reports`);
    console.log('reports list:', await reportsList.json());

    const examsList = await fetch(`${base}/exams`);
    console.log('exams list:', await examsList.json());
  } catch (err) {
    console.error('Error during test submission:', err);
    process.exit(1);
  }
})();
