import React from 'react';
import { GraduationCap, Maximize } from 'lucide-react';

const Navbar = ({ results, setResults, setFiles, setSubject, toggleFullscreen }) => {
  return (
    <nav className="sticky top-0 w-full z-50 bg-[#0a0a0a]/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0a0a0a]/40 border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 md:py-4 flex items-center justify-between">
        <button 
          onClick={() => { setResults(null); setFiles([]); setSubject(''); }}
          className="flex items-center gap-3 group transition-opacity hover:opacity-80 focus:outline-none"
          title="Return to Workspace"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <GraduationCap className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight group-hover:text-indigo-100 transition-colors">EduNest</span>
        </button>
        <div className="flex items-center gap-4 text-sm font-mono text-gray-400">
          {results && (
            <>
              <button 
                onClick={toggleFullscreen}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#121212] text-gray-400 border border-[#262626] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors text-xs shadow-sm"
                title="Enter Fullscreen"
              >
                <Maximize size={14} /> Fullscreen
              </button>
              <button 
                onClick={() => { setResults(null); setFiles([]); setSubject(''); setQuizData(null); }}
                className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#121212] text-gray-300 border border-[#262626] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors text-xs shadow-sm hover:shadow-md"
              >
                &larr; New Workspace
              </button>
            </>
          )}

          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121212] border border-[#262626] text-xs shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
            API Active
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
