import React, { useState, useEffect } from 'react';
import { GraduationCap, Maximize, Minimize, Sparkles, ArrowRight, TrendingUp, Sun, Moon } from 'lucide-react';

const Navbar = ({
  results, setResults, setFiles, setSubject,
  toggleFullscreen, isFullscreen,
  view, setView,
  quizHistory, showAnalytics, setShowAnalytics,
  theme, setTheme,
  user, onLogout
}) => {
  const isWorkspace = results !== null;
  const isLanding = view === 'landing';
  const isAuth = view === 'login' || view === 'register';

  // ── API Health Check ─────────────────────────────────────────────────────────
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'active' | 'inactive'

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(4000),
        });
        setApiStatus(res.ok ? 'active' : 'inactive');
      } catch {
        setApiStatus('inactive');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: {
      dot: 'bg-gray-400 animate-pulse',
      text: 'text-gray-500',
      label: 'Checking...',
      border: 'border-gray-200 dark:border-[#2a2a2a]',
    },
    active: {
      dot: 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      text: 'text-emerald-600 dark:text-emerald-400',
      label: 'API Active',
      border: 'border-emerald-500/30 dark:border-emerald-500/20',
    },
    inactive: {
      dot: 'bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_6px_rgba(239,68,68,0.7)]',
      text: 'text-red-600 dark:text-red-400',
      label: 'API Offline',
      border: 'border-red-500/30 dark:border-red-500/20',
    },
  };

  const { dot, text, label, border } = statusConfig[apiStatus];

  // ── Fullscreen compact bar ────────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <nav className="fixed top-0 inset-x-0 z-50 h-[56px] bg-white dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-[#1e1e1e] flex items-center justify-between px-5 shadow-sm no-print">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center ring-1 ring-indigo-400/30 dark:ring-0 shadow shadow-indigo-500/40">
            <GraduationCap size={13} style={{ color: '#ffffff' }} />
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">EduNest</span>
          <Sparkles size={9} className="text-indigo-400 opacity-70 animate-pulse" />
        </div>

        {/* Center — fullscreen label */}
        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest hidden sm:block">
          Fullscreen Mode
        </span>

        {/* Right — Exit + theme */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>

          {/* Exit fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-md font-bold text-xs hover:bg-gray-700 dark:hover:bg-gray-200 transition-all shadow-sm"
            title="Exit Fullscreen"
          >
            <Minimize size={12} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </nav>
    );
  }

  // ── Normal Navbar ─────────────────────────────────────────────────────────────
  return (
    <nav className="sticky top-0 w-full z-50 bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-3.5 flex items-center justify-between">

        {/* Logo — always clickable back to landing */}
        <button
          onClick={() => { 
            if (isLanding) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setResults(null); 
              setFiles([]); 
              setSubject(''); 
              setView('app'); 
              setShowAnalytics?.(false); 
            }
          }}
          className="flex items-center gap-3 group focus:outline-none"
          title="Return to Home"
        >
          {/* Badge — gradient with ring in light mode for contrast */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center ring-1 ring-indigo-400/30 dark:ring-0 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-200">
            <GraduationCap size={18} style={{ color: '#ffffff' }} />
          </div>
          <div className="relative flex items-center gap-1">
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors duration-200">EduNest</span>
            <Sparkles size={9} className="text-indigo-500 dark:text-indigo-400 opacity-80 animate-pulse" />
          </div>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2 text-sm font-mono">

          {/* Back Button */}
          {(showAnalytics || view === 'profile' || (view === 'app' && results !== null)) && (
            <button
              onClick={() => {
                if (showAnalytics) {
                  setShowAnalytics(false);
                } else if (view === 'profile') {
                  setView(user ? 'app' : 'landing');
                } else if (view === 'app' && results !== null) {
                  setResults(null); setFiles([]); setSubject(''); setView('app');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#262626] rounded-md hover:bg-gray-200 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-colors text-xs font-bold shadow-sm"
            >
              ← Back
            </button>
          )}

          {/* Fullscreen control (only when results are showing) */}
          {isWorkspace && (
            <button
              onClick={toggleFullscreen}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#262626] rounded-md hover:bg-gray-200 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-colors text-xs shadow-sm"
              title="Enter Fullscreen"
            >
              <Maximize size={12} /> <span className="hidden lg:inline">Fullscreen</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="group flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* History / Analytics toggle — shown whenever history exists (not on landing) */}
          {quizHistory?.length > 0 && !isLanding && (
            <button
              onClick={() => setShowAnalytics?.(prev => !prev)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-all ${
                showAnalytics
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-400/50 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-[#111] border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white'
              } shadow-sm`}
              title="Quiz History &amp; Analytics"
            >
              <TrendingUp size={12} /> <span className="hidden sm:inline">History</span>
              <span className="ml-0.5 bg-indigo-500 text-white font-bold text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {quizHistory.length > 9 ? '9+' : quizHistory.length}
              </span>
            </button>
          )}

          {/* Auth/Profile Actions */}
          {!isAuth && (
            user ? (
              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={() => setView('profile')}
                  className="group flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-900 dark:text-white font-bold text-[11px] shadow-sm hover:shadow-indigo-500/30 transition-all active:scale-95"
                  title="View Profile"
                >
                  {(user.username?.[0] || 'U').toUpperCase()}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="group flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95 shadow-sm ml-1"
              >
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Login</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )
          )}

          {/* API status pill — always visible (except on landing) */}
          {!isLanding && (
            <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-50 dark:bg-[#111] border ${border} text-xs shadow-sm transition-all duration-500`}>
              <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 ${dot}`} />
              <span className={`transition-colors duration-500 ${text} hidden sm:inline font-mono text-[11px]`}>{label}</span>
            </span>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
