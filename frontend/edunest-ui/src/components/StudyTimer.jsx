import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, Timer, Play, Pause, RotateCcw,
  Sparkles, Volume2, VolumeX, Target, TrendingUp, Trash2, Coffee, Flame, Zap, Clock
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const LS_KEY = 'edunest_study_timer_state';
const LS_STATS_KEY = 'edunest_study_timer_stats';

function pad(n) { return String(n).padStart(2, '0'); }

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function msToHMS(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s };
}

// ── Web Audio Chime ────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.setValueAtTime(1108, ctx.currentTime + 0.15);
    osc1.frequency.setValueAtTime(1320, ctx.currentTime + 0.3);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.05);
    osc2.frequency.setValueAtTime(2217, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.6);

    setTimeout(() => ctx.close(), 1200);
  } catch (e) {
    console.warn('Audio chime failed:', e);
  }
}

// ── Presets ─────────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Pomodoro', minutes: 25, icon: <Flame size={13} />, color: 'text-red-400', activeGlow: 'shadow-red-500/20' },
  { label: 'Deep Work', minutes: 50, icon: <Zap size={13} />, color: 'text-indigo-400', activeGlow: 'shadow-indigo-500/20' },
  { label: 'Short Break', minutes: 5, icon: <Coffee size={13} />, color: 'text-emerald-400', activeGlow: 'shadow-emerald-500/20' },
  { label: 'Long Break', minutes: 15, icon: <Coffee size={13} />, color: 'text-teal-400', activeGlow: 'shadow-teal-500/20' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ── Flip Digit Card ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const DIGIT_FONT = {
  fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
  fontFeatureSettings: '"tnum"',
  lineHeight: 1,
};

// ── HalfPanel — MUST be outside FlipCard for stable React identity ─────────
function HalfPanel({ digit, isTop, bg, extraClassName, extraStyle }) {
  return (
    <div
      className={`absolute left-0 right-0 overflow-hidden ${isTop ? 'top-0 rounded-t-2xl' : 'bottom-0 rounded-b-2xl'} ${extraClassName || ''}`}
      style={{ height: '50%', ...(extraStyle || {}) }}
    >
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: '200%',
          background: bg,
          ...(isTop ? {} : { transform: 'translateY(-50%)' }),
        }}
      >
        <span
          className="font-black text-white select-none"
          style={{ ...DIGIT_FONT, fontSize: 'clamp(4rem, 10vw, 6.5rem)' }}
        >
          {digit}
        </span>
      </div>
      {!isTop && (
        <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

// ── FlipCard — memoized so parent timer ticks don't kill animations ────────
const FlipCard = React.memo(function FlipCard({ value, label }) {
  const current = pad(value);
  const prevRef = useRef(current);
  const [animating, setAnimating] = useState(false);
  const [oldVal, setOldVal] = useState(current);

  useEffect(() => {
    if (current !== prevRef.current) {
      setOldVal(prevRef.current);
      setAnimating(true);
      const timer = setTimeout(() => {
        setAnimating(false);
        prevRef.current = current;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [current]);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          {label}
        </span>
      )}
      <div
        className="relative w-[100px] h-[130px] sm:w-[130px] sm:h-[170px] md:w-[150px] md:h-[190px]"
        style={{ perspective: '400px' }}
      >
        {/* ── Static back layer (always visible behind flaps) ───────── */}
        <HalfPanel digit={current} isTop={true} bg="#1e1e1e" />
        <HalfPanel digit={animating ? oldVal : current} isTop={false} bg="#171717" />

        {/* ── Seam line + notches ───────────────────────────────────── */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-black/60 z-20 pointer-events-none" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-[#0a0a0a] z-20 -ml-[3px]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-[#0a0a0a] z-20 -mr-[3px]" />

        {/* ── Animated flaps (only during flip) ─────────────────────── */}
        {animating && (
          <>
            {/* Top flap: shows OLD value, folds DOWN */}
            <HalfPanel
              digit={oldVal}
              isTop={true}
              bg="#1e1e1e"
              extraClassName="z-30"
              extraStyle={{
                transformOrigin: 'bottom center',
                animation: 'flipTop 0.3s ease-in forwards',
                backfaceVisibility: 'hidden',
              }}
            />
            {/* Bottom flap: shows NEW value, unfolds into place */}
            <HalfPanel
              digit={current}
              isTop={false}
              bg="#171717"
              extraClassName="z-30"
              extraStyle={{
                transformOrigin: 'top center',
                animation: 'flipBottom 0.3s ease-out 0.3s forwards',
                transform: 'rotateX(90deg)',
                backfaceVisibility: 'hidden',
              }}
            />
          </>
        )}

        {/* Border overlay (topmost) */}
        <div className="absolute inset-0 rounded-2xl border border-[#2a2a2a] pointer-events-none z-40" />
      </div>
    </div>
  );
});

// ── Colon separator ────────────────────────────────────────────────────────────
function ColonSeparator({ active }) {
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 pt-6 sm:pt-8">
      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${active ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'bg-gray-600'}`} />
      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${active ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'bg-gray-600'}`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Main Component ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudyTimer({ onBack }) {
  // ── Focus Timer state ────────────────────────────────────────────────────
  const [duration, setDuration] = useState(25 * 60 * 1000);
  const [remaining, setRemaining] = useState(25 * 60 * 1000);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');


  // ── Settings ─────────────────────────────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ── Stats ────────────────────────────────────────────────────────────────
  const [dailyStats, setDailyStats] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_STATS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [dailyGoal] = useState(120);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const lastTickRef = useRef(null);

  // ── Persist stats ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_STATS_KEY, JSON.stringify(dailyStats));
  }, [dailyStats]);

  // ── Record completed focus time ──────────────────────────────────────────
  const recordFocusMinutes = useCallback((mins) => {
    const today = getTodayKey();
    setDailyStats(prev => {
      const sessions = prev[today]?.sessions || [];
      return {
        ...prev,
        [today]: {
          totalMinutes: (prev[today]?.totalMinutes || 0) + mins,
          sessions: [...sessions, { minutes: mins, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
        }
      };
    });
  }, []);

  // ── Restore persisted state ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setSoundEnabled(saved.soundEnabled !== false);

      if (saved.timerActive && saved.lastUpdated) {
        const elapsed = Date.now() - saved.lastUpdated;
        const newRemaining = saved.remaining - elapsed;
        setDuration(saved.duration);
        if (newRemaining <= 0) {
          setRemaining(0);
          setTimerDone(true);
          setTimerActive(false);
          const completedMins = Math.round(saved.duration / 60000);
          recordFocusMinutes(completedMins);
          if (saved.soundEnabled !== false) setTimeout(playChime, 300);
        } else {
          setRemaining(newRemaining);
          setTimerActive(true);
        }
      } else {
        setDuration(saved.duration || 25 * 60 * 1000);
        setRemaining(saved.remaining || saved.duration || 25 * 60 * 1000);
      }


    } catch (e) {
      console.warn('Failed to restore timer state:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist running state ────────────────────────────────────────────────
  const persistState = useCallback(() => {
    const state = {
      duration,
      remaining,
      timerActive,
      soundEnabled,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [duration, remaining, timerActive, soundEnabled]);

  useEffect(() => {
    persistState();
  }, [timerActive, soundEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleUnload = () => persistState();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [persistState]);

  // ── Focus Timer tick ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive) {
      clearInterval(timerRef.current);
      return;
    }
    lastTickRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - (lastTickRef.current || now);
      lastTickRef.current = now;

      setRemaining(prev => {
        const next = prev - delta;
        if (next <= 0) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          setTimerDone(true);
          const completedMins = Math.round(duration / 60000);
          recordFocusMinutes(completedMins);
          if (soundEnabled) playChime();
          return 0;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(timerRef.current);
  }, [timerActive, duration, soundEnabled, recordFocusMinutes]);

  // Persist every 2s while running
  useEffect(() => {
    if (!timerActive) return;
    const iv = setInterval(persistState, 2000);
    return () => clearInterval(iv);
  }, [timerActive, persistState]);

  const currentTime = msToHMS(remaining);

  // ── Timer Controls ───────────────────────────────────────────────────────
  const selectPreset = (minutes) => {
    const ms = minutes * 60 * 1000;
    setDuration(ms);
    setRemaining(ms);
    setTimerActive(false);
    setTimerDone(false);

  };

  const handleCustomSet = () => {
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 300) return;
    selectPreset(mins);
    setCustomMinutes('');
  };

  const toggleTimer = () => {
    if (timerDone) return;
    setTimerActive(prev => !prev);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerDone(false);
    setRemaining(duration);

  };

  // ── Derived values ───────────────────────────────────────────────────────
  const today = getTodayKey();
  const todayData = dailyStats[today] || { totalMinutes: 0, sessions: [] };
  const goalProgress = Math.min(1, todayData.totalMinutes / dailyGoal);
  const showHours = duration >= 3600000 || currentTime.h > 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Flip clock animation styles */}
      <style>{`
        @keyframes flipTop {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }
        @keyframes flipBottom {
          0%   { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
            <Timer className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Study Timer
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track focus sessions and optimize your study flow
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            soundEnabled
              ? 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:text-indigo-500'
              : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400'
          }`}
          title={soundEnabled ? 'Sound On' : 'Sound Off'}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Flip Clock Area ───────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 dark:border-[#1e1e1e] bg-[#0a0a0a] p-6 sm:p-10 overflow-hidden">

            {/* Presets */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => selectPreset(p.minutes)}
                  disabled={timerActive}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                    duration === p.minutes * 60 * 1000 && !timerActive && !timerDone
                      ? `bg-white/5 border-white/20 text-white shadow-lg ${p.activeGlow}`
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className={p.color}>{p.icon}</span>
                  {p.label} · {p.minutes}m
                </button>
              ))}
              {/* Custom */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1" max="300"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomSet()}
                  disabled={timerActive}
                  placeholder="Min"
                  className="w-16 px-2 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-center text-xs font-mono text-gray-300 focus:outline-none focus:border-white/20 disabled:opacity-40 transition-colors placeholder:text-gray-600"
                />
                <button
                  onClick={handleCustomSet}
                  disabled={timerActive || !customMinutes}
                  className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-gray-400 hover:border-white/20 hover:text-white disabled:opacity-40 transition-all"
                >
                  Set
                </button>
              </div>
            </div>

            {/* ── Flip Clock Display ────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
              {showHours && (
                <>
                  <FlipCard value={currentTime.h} label="Hours" />
                  <ColonSeparator active={timerActive} />
                </>
              )}
              <FlipCard value={currentTime.m} label="Minutes" />
              <ColonSeparator active={timerActive} />
              <FlipCard value={currentTime.s} label="Seconds" />
            </div>

            {/* Status text */}
            <p className="text-center text-xs font-mono uppercase tracking-[0.25em] mb-8 h-4 transition-colors duration-300" style={{ color: timerDone ? '#34d399' : timerActive ? '#a78bfa' : '#4b5563' }}>
              {timerDone ? '✨ Session Complete!' : timerActive ? 'Focusing...' : `${Math.round(duration / 60000)} minute session`}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {timerDone ? (
                <button
                  onClick={resetTimer}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-95"
                >
                  <RotateCcw size={16} /> New Session
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleTimer}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
                      timerActive
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40'
                    }`}
                  >
                    {timerActive ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                  </button>
                  {(timerActive || remaining !== duration) && (
                    <button
                      onClick={resetTimer}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-red-400 hover:border-red-500/30 font-semibold text-sm transition-all active:scale-95"
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar: Focus Stats ───────────────────────────────────── */}
        <div className="space-y-4">

          {/* Today's Progress */}
          <div className="rounded-2xl border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#0d0d0d] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Today's Focus</h3>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400 font-mono">
                  {todayData.totalMinutes} / {dailyGoal} min
                </span>
                <span className="text-gray-400 dark:text-gray-500 font-mono">
                  {Math.round(goalProgress * 100)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 dark:bg-[#1e1e1e] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                  style={{ width: `${goalProgress * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] text-center">
                <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{todayData.totalMinutes}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Minutes</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] text-center">
                <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{todayData.sessions?.length || 0}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Sessions</p>
              </div>
            </div>
          </div>

          {/* Session History */}
          <div className="rounded-2xl border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#0d0d0d] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Sessions</h3>
              </div>
              {todayData.sessions?.length > 0 && (
                <button
                  onClick={() => {
                    setDailyStats(prev => {
                      const copy = { ...prev };
                      delete copy[today];
                      return copy;
                    });
                  }}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear today's history"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {todayData.sessions?.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...todayData.sessions].reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#1e1e1e]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.minutes} min</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{s.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500">No sessions yet today</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">Complete a focus session to see history</p>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 p-5">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">Focus Tip</p>
                <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/70 leading-relaxed">
                  The Pomodoro Technique suggests 25-minute focused sessions followed by a 5-minute break. After 4 sessions, take a longer 15–30 minute break.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
