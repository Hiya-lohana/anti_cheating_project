import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Building2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { signUpUser, loginUser, fetchOrganizations } from '../firebase';

export default function AuthModal({ role, onClose, onSuccess }) {
  const [tab, setTab] = useState('signup'); // 'login' | 'signup'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  
  // Organizations list
  const [organizations, setOrganizations] = useState([]);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrgs() {
      try {
        const orgs = await fetchOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedOrgId(orgs[0].id);
          setOrganizationName(orgs[0].name);
        }
      } catch (err) {
        console.error('Error fetching orgs for modal:', err);
      }
    }
    loadOrgs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const { profile } = await loginUser(email, password, role);
        if (profile) {
          profile.role = role || profile.role;
        }
        onSuccess(profile);
      } else {
        // Sign Up
        if (!name.trim()) throw new Error('Please enter your full name');
        if (role === 'instructor' && !organizationName.trim()) {
          throw new Error('Please enter your organization or institution name');
        }

        let finalOrgId = selectedOrgId;
        let finalOrgName = organizationName;

        if (role === 'student' && organizations.length > 0) {
          const matched = organizations.find(o => o.id === selectedOrgId);
          if (matched) {
            finalOrgId = matched.id;
            finalOrgName = matched.name;
          }
        }

        const profile = await signUpUser({
          email,
          password,
          name: name.trim(),
          role,
          organizationName: finalOrgName,
          organizationId: finalOrgId
        });

        onSuccess(profile);
      }
    } catch (err) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please try again.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered! Please switch to the "Sign In" tab to log into your account.';
      } else if (msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) {
        msg = 'Invalid email or password. Please check your details and try again.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters long.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0e1424] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 text-slate-100 overflow-hidden">
        {/* Top Glow Accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role === 'instructor' ? 'from-indigo-500 to-purple-500' : 'from-cyan-500 to-indigo-500'}`}></div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${role === 'instructor' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
            {role === 'instructor' ? 'Instructor Portal' : 'Student Portal'}
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'login' ? 'Enter your credentials to access your dashboard' : 'Fill in details to set up your profile'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${tab === 'login' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${tab === 'signup' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.edu"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Instructor Organization Input */}
          {tab === 'signup' && role === 'instructor' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Organization / School Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Oxford Cyber Institute"
                  className="w-full bg-slate-900/90 border border-indigo-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Student Organization Select Dropdown */}
          {tab === 'signup' && role === 'student' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Your Organization / School</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                {organizations.length > 0 ? (
                  <select
                    value={selectedOrgId}
                    onChange={(e) => {
                      setSelectedOrgId(e.target.value);
                      const matched = organizations.find(o => o.id === e.target.value);
                      if (matched) setOrganizationName(matched.name);
                    }}
                    className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                        {org.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Oxford Cyber Institute"
                    className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Connect to your instructor's organization to access tests.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-2 transition-all ${role === 'instructor' ? 'bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-300 hover:to-purple-300' : 'bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300'} shadow-lg shadow-cyan-500/20 disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
