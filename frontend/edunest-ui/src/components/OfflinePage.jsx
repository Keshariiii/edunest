/* eslint-disable */
import React, { useState, useEffect } from 'react';

const OfflinePage = ({ onRetry }) => {
  const [dots, setDots] = useState('');
  const [checking, setChecking] = useState(false);

  // Animate the "waiting" dots
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(id);
  }, []);

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      onRetry?.();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] px-6 text-center">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-1 shadow-lg shadow-red-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-9 h-9 text-red-400">
              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-2xl border border-red-500/20 animate-ping opacity-30" />
        </div>

        {/* Heading */}
        <p className="font-mono text-xs text-red-400/70 uppercase tracking-widest mb-3">
          connection_error
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
          You're Offline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
          EduNest needs an internet connection to generate study materials and sync your session. Please check your network and try again.
        </p>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#262626] mb-8 font-mono text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {checking ? `Checking connection${dots}` : `Waiting for network${dots}`}
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={checking}
          className="w-full max-w-xs py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-60 transition-all active:scale-[0.98] shadow-sm mb-4"
        >
          {checking ? 'Checking…' : 'Try Again'}
        </button>

        {/* Tips */}
        <div className="w-full max-w-xs bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-5 text-left mt-2 shadow-sm">
          <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-3">// Suggestions</p>
          {[
            'Check your Wi-Fi or mobile data',
            'Try disabling and re-enabling your connection',
            'Move closer to your router if on Wi-Fi',
            'Your previously generated notes are cached — connect to view them',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
              <span className="text-indigo-400 font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-gray-400 font-mono text-[10px] mt-6">
          EduNest will reconnect automatically
        </p>
      </div>
    </div>
  );
};

export default OfflinePage;
