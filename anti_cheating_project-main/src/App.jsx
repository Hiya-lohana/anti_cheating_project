import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentSection from './pages/StudentSection';
import ExamInterface from './pages/ExamInterface';
import LiveProctor from './pages/LiveProctor';
import AdminDashboard from './pages/AdminDashboard';
import ExamCreation from './pages/ExamCreation';
import CheatingReport from './pages/CheatingReport';

import MainLayout from './components/MainLayout';

function App() {
  const [currentTab, setCurrentTab] = useState('landing');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [user, setUser] = useState({ isAuthenticated: false, role: null, name: '', email: '' });

  const studentNav = [
    { id: 'landing', label: 'Home' },
    { id: 'student', label: 'Dashboard' },
    { id: 'student-exams', label: 'My Exams' },
    { id: 'student-results', label: 'Results' },
    { id: 'student-analytics', label: 'Analytics' },
    { id: 'student-calendar', label: 'Calendar' },
    { id: 'student-profile', label: 'Profile' },
    { id: 'student-settings', label: 'Settings' }
  ];

  const teacherNav = [
    { id: 'landing', label: 'Home' },
    { id: 'admin', label: 'Instructor Dashboard' },
    { id: 'create-exam', label: 'Create Exam' },
    { id: 'report', label: 'Integrity Report' },
    { id: 'live-proctor', label: 'Live Proctor' }
  ];

  const navItems = user.isAuthenticated
    ? user.role === 'teacher' ? teacherNav : studentNav
    : [
        { id: 'landing', label: 'Home' },
        { id: 'auth', label: 'Sign In' }
      ];

  const teacherOnlyRoutes = ['admin', 'create-exam', 'report', 'live-proctor'];
  const studentOnlyRoutes = ['student', 'exam', 'student-exams', 'student-results', 'student-analytics', 'student-calendar', 'student-profile', 'student-settings'];

  const handleNavigate = (id, options = {}) => {
    if (id === 'auth') {
      setSelectedRole(options.role || null);
      setCurrentTab('auth');
      return;
    }

    if (id === 'exam') {
      setSelectedExamId(options.examId || null);
      setCurrentTab('exam');
      return;
    }

    if (!user.isAuthenticated && id !== 'landing') {
      setSelectedRole(options.role || null);
      setCurrentTab('auth');
      return;
    }

    if (user.isAuthenticated && user.role === 'student' && teacherOnlyRoutes.includes(id)) {
      setCurrentTab('student');
      return;
    }

    if (user.isAuthenticated && user.role === 'teacher' && studentOnlyRoutes.includes(id)) {
      setCurrentTab('admin');
      return;
    }

    setCurrentTab(id);
  };

  const handleLogin = (role, name, email) => {
    setUser({ isAuthenticated: true, role, name, email });
    setCurrentTab(role === 'teacher' ? 'admin' : 'student');
  };

  const handleLogout = () => {
    setUser({ isAuthenticated: false, role: null, name: '', email: '' });
    setCurrentTab('landing');
    setSelectedRole(null);
    setSelectedExamId(null);
  };

  const renderCurrent = () => {
    const pageProps = { onNavigate: handleNavigate, user, onLogin: handleLogin, onLogout: handleLogout };

    if (currentTab === 'auth') {
      return <AuthPage {...pageProps} initialRole={selectedRole} />;
    }

    if (!user.isAuthenticated && currentTab !== 'landing') {
      return <AuthPage {...pageProps} initialRole={selectedRole} />;
    }

    switch (currentTab) {
      case 'student': return <StudentDashboard {...pageProps} />;
      case 'student-exams': return <StudentSection {...pageProps} section="student-exams" activeTab="My Exams" />;
      case 'student-results': return <StudentSection {...pageProps} section="student-results" activeTab="Results" />;
      case 'student-analytics': return <StudentSection {...pageProps} section="student-analytics" activeTab="Analytics" />;
      case 'student-calendar': return <StudentSection {...pageProps} section="student-calendar" activeTab="Calendar" />;
      case 'student-profile': return <StudentSection {...pageProps} section="student-profile" activeTab="Profile" />;
      case 'student-settings': return <StudentSection {...pageProps} section="student-settings" activeTab="Settings" />;
      case 'exam': return <ExamInterface {...pageProps} examId={selectedExamId} />;
      case 'live-proctor': return <LiveProctor {...pageProps} />;
      case 'admin': return <AdminDashboard {...pageProps} />;
      case 'create-exam': return <ExamCreation {...pageProps} />;
      case 'report': return <CheatingReport {...pageProps} />;
      default: return <LandingPage {...pageProps} />;
    }
  };

  const isPublicPage = currentTab === 'landing' || currentTab === 'auth';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {isPublicPage && (
        <header className="bg-[#0b111a] border-b border-slate-800/40">
          <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="font-black text-white">P</span>
              </div>
              <div>
                <div className="text-sm font-bold">Secure Exam Hub</div>
                <div className="text-[11px] text-slate-400">Assessment & Proctoring</div>
              </div>
            </div>
          </div>
        </header>
      )}
      <div className="flex-1 flex">
        {user.isAuthenticated && !isPublicPage && (
          <MainLayout currentTab={currentTab} onNavigate={handleNavigate} navItems={navItems} user={user} onLogout={handleLogout}>
            {renderCurrent()}
          </MainLayout>
        )}
        {!user.isAuthenticated || isPublicPage ? (
          <div className="flex-1">{renderCurrent()}</div>
        ) : null}
      </div>
    </div>
  );
}

export default App;