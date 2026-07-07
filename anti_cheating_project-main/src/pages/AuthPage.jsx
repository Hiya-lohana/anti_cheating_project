import React, { useState } from 'react';
import { login } from '../api';
import { registerWithFirebase } from '../firebase';

export default function AuthPage({ onNavigate, onLogin, initialRole }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [role, setRole] = useState(initialRole || 'student');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const showRoleSelection = !initialRole;

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const userCredential = await registerWithFirebase(email, password);
      const user = userCredential.user;
      onLogin(role, name || user.email.split('@')[0], user.email);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !pin) {
      setError('Please enter your email and PIN.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await login({ role, email, pin, name });
      onLogin(role, name || response.name || email.split('@')[0], email);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f19] p-8 flex flex-col items-center justify-center gap-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {showRoleSelection ? (
          <div className="bg-[#111c44] border border-slate-800/60 p-8 rounded-3xl shadow-xl">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">Secure Access</h2>
              <p className="text-sm text-slate-400">Select your role to get started.</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { id: 'student', title: 'Student', subtitle: 'Take exams securely' },
                { id: 'teacher', title: 'Instructor', subtitle: 'Manage exams and proctor' }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option.id)}
                  className={`rounded-3xl border p-5 text-left transition-all ${role === option.id ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-800 bg-[#0b0f19] text-slate-300 hover:border-indigo-500 hover:text-white'}`}
                >
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="block text-[11px] text-slate-400 mt-2">{option.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#111c44] border border-slate-800/60 p-8 rounded-3xl shadow-xl flex flex-col justify-center items-center text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-indigo-300 text-xs uppercase font-semibold tracking-widest">
              {role === 'teacher' ? 'Instructor Portal' : 'Student Portal'}
            </div>
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-white">{role === 'teacher' ? 'Instructor Access' : 'Student Access'}</h2>
              <p className="text-sm text-slate-400 mt-3 max-w-sm mx-auto">Sign in or create a new account with Firebase authentication.</p>
            </div>
          </div>
        )}

        <div className="bg-[#111c44] border border-slate-800/60 p-8 rounded-3xl shadow-xl">
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            <button
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`px-4 py-3 font-semibold text-sm transition-all ${
                authMode === 'login'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setError('');
              }}
              className={`px-4 py-3 font-semibold text-sm transition-all ${
                authMode === 'signup'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">{role === 'teacher' ? 'Instructor Login' : 'Student Login'}</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@institution.edu"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Access PIN</label>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  type="password"
                  placeholder={role === 'teacher' ? '4321' : '1234'}
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name (optional)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Your name"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {error && <div className="text-sm text-rose-400 bg-[#3b0c14] border border-rose-500/25 rounded-2xl p-3">{error}</div>}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide py-3.5 rounded-3xl transition-all shadow-md shadow-indigo-600/10"
              >
                {isLoading ? 'Signing in…' : 'Login'}
              </button>
            </div>
          )}

          {/* Sign Up Form */}
          {authMode === 'signup' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Create New Account</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@institution.edu"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {error && <div className="text-sm text-rose-400 bg-[#3b0c14] border border-rose-500/25 rounded-2xl p-3">{error}</div>}
              <button
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide py-3.5 rounded-3xl transition-all shadow-md shadow-emerald-600/10"
              >
                {isLoading ? 'Creating account…' : 'Sign Up'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
