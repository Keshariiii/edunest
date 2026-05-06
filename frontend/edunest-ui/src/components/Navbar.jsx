import React, { useState, useEffect } from 'react';
import { GraduationCap, Maximize, Sparkles, ArrowRight, TrendingUp, Sun, Moon } from 'lucide-react';

const Navbar = ({ results, setResults, setFiles, setSubject, toggleFullscreen, view, setView, quizHistory, showAnalytics, setShowAnalytics, theme, setTheme }) => {
  const isWorkspace = results !== null;
  const isLanding = view === 'landing';

  // ── API Health Check ──────────────────────────────────────────────────────
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'active' | 'inactive'

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(4000), // 4s timeout
        });
        setApiStatus(res.ok ? 'active' : 'inactive');
      } catch {
        setApiStatus('inactive');
      }
    };

    checkHealth(); // run immediately on mount
    const interval = setInterval(checkHealth, 5000); // then every 5s
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: {
      dot: 'bg-gray-500 animate-pulse',
      text: 'text-gray-500',
      label: 'Checking...',
      border: 'border-gray-200 dark:border-[#262626]',
    },
    active: {
      dot: 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      text: 'text-emerald-400',
      label: 'API Active',
      border: 'border-emerald-500/20',
    },
    inactive: {
      dot: 'bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_6px_rgba(239,68,68,0.7)]',
      text: 'text-red-400',
      label: 'API Offline',
      border: 'border-red-500/20',
    },
  };

  const { dot, text, label, border } = statusConfig[apiStatus];

  return (
    <nav className="sticky top-0 w-full z-50 bg-white/80 dark:bg-[#0a0a0a]/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-[#0a0a0a]/60 border-b border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-4 flex items-center justify-between">

        {/* Logo — always clickable back to landing */}
        <button
          onClick={() => { setResults(null); setFiles([]); setSubject(''); setView('landing'); setShowAnalytics?.(false); }}
          className="flex items-center gap-3 group transition-opacity hover:opacity-80 focus:outline-none"
          title="Return to Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <GraduationCap className="text-gray-900 dark:text-white" size={18} />
          </div>
          <div className="relative flex items-center">
            <span className="font-bold text-lg tracking-tight group-hover:text-indigo-100 transition-colors">EduNest</span>
            <Sparkles size={10} className="absolute -top-1.5 -right-3.5 text-indigo-400 opacity-70 animate-pulse" />
          </div>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3 text-sm font-mono text-gray-600 dark:text-gray-400">

          {/* Back Button (Always visible when not on landing) */}
          {!isLanding && (
            <button
              onClick={() => {
                if (isWorkspace) {
                  setResults(null); setFiles([]); setSubject(''); setView('app'); setShowAnalytics?.(false);
                } else {
                  setView('landing'); setShowAnalytics?.(false);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#262626] rounded-md hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-colors text-xs font-bold shadow-sm"
            >
              ← Back
            </button>
          )}

          {/* Fullscreen control (only visible when results are showing) */}
          {isWorkspace && (
            <button
              onClick={toggleFullscreen}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#262626] rounded-md hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-colors text-xs"
              title="Enter Fullscreen"
            >
              <Maximize size={13} /> Fullscreen
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={`group flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm ${
              isLanding 
                ? 'bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-[#404040]' 
                : 'bg-white dark:bg-[#121212] border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
            }`}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* History / Analytics toggle — shown only in workspace when history exists */}
          {isWorkspace && quizHistory?.length > 0 && (
            <button
              onClick={() => setShowAnalytics?.(prev => !prev)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-all ${
                showAnalytics
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-white dark:bg-[#121212] border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
              }`}
              title="Quiz History & Analytics"
            >
              <TrendingUp size={12} /> <span className="hidden sm:inline">History</span>
              <span className="ml-0.5 bg-indigo-500 text-gray-900 dark:text-white font-bold text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {quizHistory.length > 9 ? '9+' : quizHistory.length}
              </span>
            </button>
          )}

          {/* Landing-page CTA */}
          {isLanding && (
            <button
              onClick={() => setView('app')}
              className="group flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">Launch</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* API status dot — always visible (except on landing) */}
          {!isLanding && (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#121212] border ${border} text-xs shadow-sm transition-all duration-500`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${dot}`} />
              <span className={`transition-colors duration-500 ${text} hidden sm:inline`}>{label}</span>
            </span>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
