/* eslint-disable */
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Check, X, AlertCircle, GraduationCap, Sparkles, ArrowLeft } from 'lucide-react';

// ── Password Strength Calculator ───────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 4) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

// ── Password Requirements List ─────────────────────────────────────────────────
function PasswordRequirements({ password }) {
  const reqs = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One digit', met: /[0-9]/.test(password) },
  ];
  return (
    <div className="mt-3 ml-2 space-y-1.5">
      {reqs.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-[11px] font-mono">
          {r.met ? (
            <Check size={12} className="text-emerald-500 shrink-0" />
          ) : (
            <X size={12} className="text-gray-400 shrink-0" />
          )}
          <span className={r.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main AuthView Component ────────────────────────────────────────────────────
export default function AuthView({ onAuthSuccess, initialMode = 'login', onBack }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const strength = getPasswordStrength(password);

  const clearForm = () => {
    setEmail(''); setUsername(''); setPassword(''); setConfirmPassword('');
    setShowPassword(false); setError(''); setSuccess('');
    setAgreedToTerms(false); setRememberMe(false);
  };

  // ── Register ──────────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!agreedToTerms) return setError('You must agree to the Terms of Service');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        if (typeof detail === 'string') throw new Error(detail);
        // Pydantic validation errors come as an array
        if (Array.isArray(detail)) {
          const messages = detail.map(d => d.msg?.replace('Value error, ', '') || d.msg || JSON.stringify(d));
          throw new Error(messages.join('. '));
        }
        throw new Error(JSON.stringify(detail));
      }
      // Save tokens
      localStorage.setItem('edunest_access_token', data.access_token);
      localStorage.setItem('edunest_refresh_token', data.refresh_token);
      onAuthSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
      localStorage.setItem('edunest_access_token', data.access_token);
      localStorage.setItem('edunest_refresh_token', data.refresh_token);
      onAuthSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      setSuccess(data.message);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ────────────────────────────────────────────────────────
  const inputClass =
    'w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all text-xs font-bold rounded-lg border border-gray-200/50 dark:border-white/5 shadow-sm"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo-light.png" alt="EduNest Logo" className="h-20 w-auto block dark:hidden object-contain rounded-2xl shadow-sm" />
            <img src="/logo-dark.png" alt="EduNest Logo" className="h-20 w-auto hidden dark:block object-contain rounded-2xl shadow-sm" />
          </div>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-600 uppercase tracking-widest">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/30">

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-xs font-mono">{error}</p>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">{success}</p>
            </div>
          )}

          {/* ── REGISTER FORM ─────────────────────────────────────────────── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Username */}
              <div className="relative flex items-center">
                <User size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                <input
                  id="register-username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              {/* Email */}
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                <input
                  id="register-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              {/* Password */}
              <div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="mt-3 ml-1 mr-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : 'bg-gray-200 dark:bg-[#222]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] font-mono mt-1.5 ml-1 ${
                      strength.score <= 1 ? 'text-red-500' :
                      strength.score <= 2 ? 'text-orange-500' :
                      strength.score <= 3 ? 'text-yellow-500' : 'text-emerald-500'
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
                <PasswordRequirements password={password} />
              </div>
              {/* Confirm Password */}
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  required
                />
                {confirmPassword && (
                  <div className="absolute right-3.5 flex items-center justify-center">
                    {password === confirmPassword ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : (
                      <X size={16} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {/* Terms */}
              <label className="flex items-center gap-2.5 cursor-pointer ml-1">
                <input
                  id="register-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="m-0 w-4 h-4 rounded border-gray-300 dark:border-[#333] text-indigo-600 focus:ring-indigo-500 bg-gray-50 dark:bg-[#111]"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 pt-px">
                  I agree to the <span className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer">Terms of Service</span> and <span className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              {/* Switch to login */}
              <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
                Already have an account?{' '}
                <button type="button" onClick={() => { clearForm(); setMode('login'); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ── LOGIN FORM ────────────────────────────────────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              {/* Password */}
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between ml-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="m-0 w-4 h-4 rounded border-gray-300 dark:border-[#333] text-indigo-600 focus:ring-indigo-500 bg-gray-50 dark:bg-[#111]"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 pt-px">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { clearForm(); setMode('forgot'); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              {/* Switch to register */}
              <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
                Don't have an account?{' '}
                <button type="button" onClick={() => { clearForm(); setMode('register'); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── FORGOT PASSWORD FORM ──────────────────────────────────────── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-4 text-gray-400 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button
                id="forgot-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
                <button type="button" onClick={() => { clearForm(); setMode('login'); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  ← Back to Sign In
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-6 font-mono">
          EduNest — AI-Powered Learning Platform
        </p>
      </div>
    </div>
  );
}
