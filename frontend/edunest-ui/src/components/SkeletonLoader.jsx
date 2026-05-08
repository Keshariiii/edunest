/* eslint-disable */
import React from 'react';

// ─── Generic pulsing block ────────────────────────────────────────────────────
export const SkeletonBox = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-[#1e1e1e] animate-pulse rounded-md ${className}`} />
);

// ─── Full-screen app loader (used while restoring session) ────────────────────
export const AppLoading = ({ message = 'Connecting…', detail = '' }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] px-6">
    {/* Spinner */}
    <div className="relative w-10 h-10 mb-6">
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-[#262626]" />
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
    </div>

    {/* Text */}
    <p className="text-gray-900 dark:text-white font-semibold text-base mb-1">{message}</p>
    {detail && <p className="text-gray-500 text-sm">{detail}</p>}
  </div>
);

// ─── Slow-network / error state ───────────────────────────────────────────────
export const SlowNetworkBanner = ({ onRetry }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm mx-auto">
    <div className="bg-white dark:bg-[#121212] border border-yellow-400/40 rounded-xl shadow-xl px-5 py-4 flex items-start gap-3">
      <div className="shrink-0 w-5 h-5 mt-0.5 text-yellow-500">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">Slow connection detected</p>
        <p className="text-gray-500 text-xs mt-0.5">The server is taking longer than expected. Check your network or try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        Retry
      </button>
    </div>
  </div>
);

// ─── Skeleton for the Formulas tab ───────────────────────────────────────────
export const FormulasSkeleton = () => (
  <div className="w-full max-w-5xl mx-auto">
    <div className="bg-white dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-[#262626] shadow-xl overflow-hidden min-h-[500px]">
      {/* IDE header */}
      <div className="bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-[#262626] px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
        </div>
        <SkeletonBox className="w-28 h-3 mx-auto" />
      </div>
      <div className="p-8 md:p-12 space-y-10">
        <SkeletonBox className="w-52 h-9" />
        {[1, 2, 3].map(i => (
          <div key={i} className="border-l-2 border-gray-200 dark:border-[#262626] pl-6 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-8 h-3" />
              <SkeletonBox className="w-44 h-5" />
            </div>
            <SkeletonBox className="w-full h-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Skeleton for the Notes tab ───────────────────────────────────────────────
export const NotesSkeleton = () => (
  <div className="w-full max-w-5xl mx-auto">
    <div className="bg-white dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-[#262626] shadow-xl overflow-hidden min-h-[500px]">
      <div className="bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-[#262626] px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
        </div>
        <SkeletonBox className="w-24 h-3 mx-auto" />
      </div>
      <div className="p-8 md:p-12 space-y-6">
        <SkeletonBox className="w-48 h-9" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex gap-4 items-start">
            <SkeletonBox className="w-8 h-3 mt-1 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className={`h-4 ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} />
              {i % 2 === 0 && <SkeletonBox className="h-4 w-5/6" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Skeleton for the Flashcards tab ─────────────────────────────────────────
export const FlashcardsSkeleton = () => (
  <div className="max-w-2xl mx-auto flex flex-col items-center">
    <div className="w-full h-72 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center space-y-4">
      <SkeletonBox className="w-20 h-4" />
      <SkeletonBox className="w-full h-6" />
      <SkeletonBox className="w-3/4 h-6" />
      <SkeletonBox className="w-1/2 h-4 mt-4" />
    </div>
    <div className="flex gap-2 mt-6">
      <SkeletonBox className="w-20 h-10 rounded-md" />
      <SkeletonBox className="w-20 h-10 rounded-md" />
    </div>
  </div>
);

// ─── Inline spinner (for small in-place loading e.g. regenerate button) ──────
export const InlineSpinner = ({ size = 16 }) => (
  <svg
    className="animate-spin text-indigo-500"
    style={{ width: size, height: size }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Offline Banner (connection lost) ──────────────────────────────────────────
export const OfflineBanner = () => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm mx-auto animate-in slide-in-from-top-4 duration-300">
    <div className="bg-white dark:bg-[#0a0a0a] border border-red-500/40 rounded-xl shadow-2xl px-5 py-4 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-bold text-gray-900 dark:text-white text-sm">You are offline</p>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Changes won't be saved and generation will fail. Please check your internet connection.</p>
      </div>
    </div>
  </div>
);
