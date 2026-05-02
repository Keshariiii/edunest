import React from 'react';
import { GraduationCap, Maximize, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

const Navbar = ({ results, setResults, setFiles, setSubject, toggleFullscreen, view, setView, quizHistory, showAnalytics, setShowAnalytics }) => {
  const isWorkspace = results !== null;
  const isLanding = view === 'landing';

  return (
    <nav className="sticky top-0 w-full z-50 bg-[#0a0a0a]/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0a0a0a]/60 border-b border-white/[0.06] shadow-[0_4px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-4 flex items-center justify-between">

        {/* Logo — always clickable back to landing */}
        <button
          onClick={() => { setResults(null); setFiles([]); setSubject(''); setView('landing'); setShowAnalytics?.(false); }}
          className="flex items-center gap-3 group transition-opacity hover:opacity-80 focus:outline-none"
          title="Return to Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <GraduationCap className="text-white" size={18} />
          </div>
          <div className="relative flex items-center">
            <span className="font-bold text-lg tracking-tight group-hover:text-indigo-100 transition-colors">EduNest</span>
            <Sparkles size={10} className="absolute -top-1.5 -right-3.5 text-indigo-400 opacity-70 animate-pulse" />
          </div>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3 text-sm font-mono text-gray-400">

          {/* Workspace controls (only visible when results are showing) */}
          {isWorkspace && (
            <>
              <button
                onClick={toggleFullscreen}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#121212] text-gray-400 border border-[#262626] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors text-xs"
                title="Enter Fullscreen"
              >
                <Maximize size={13} /> Fullscreen
              </button>
              <button
                onClick={() => { setResults(null); setFiles([]); setSubject(''); setView('app'); setShowAnalytics?.(false); }}
                className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#121212] text-gray-300 border border-[#262626] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors text-xs"
              >
                ← New Workspace
              </button>
            </>
          )}

          {/* History / Analytics toggle — shown when not on landing and history exists */}
          {!isLanding && quizHistory?.length > 0 && (
            <button
              onClick={() => setShowAnalytics?.(prev => !prev)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-all ${
                showAnalytics
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-[#121212] border-[#262626] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
              title="Quiz History & Analytics"
            >
              <TrendingUp size={12} /> History
              <span className="ml-0.5 bg-indigo-500 text-white font-bold text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {quizHistory.length > 9 ? '9+' : quizHistory.length}
              </span>
            </button>
          )}

          {/* Landing-page CTA */}
          {isLanding && (
            <button
              onClick={() => setView('app')}
              className="group flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-lg font-bold text-xs hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Launch App
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* API status dot — always visible */}
          {!isLanding && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121212] border border-[#262626] text-xs shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
              API Active
            </span>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

