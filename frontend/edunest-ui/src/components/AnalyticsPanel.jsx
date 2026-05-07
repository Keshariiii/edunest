/* eslint-disable */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Clock, Trash2, BookOpen, BarChart3, Zap } from 'lucide-react';

const formatTime = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const AnalyticsPanel = ({ quizHistory, onClearHistory, onClose }) => {
  const stats = useMemo(() => {
    if (!quizHistory.length) return null;
    const avgAccuracy = Math.round(quizHistory.reduce((a, q) => a + q.accuracy, 0) / quizHistory.length);
    const bestAccuracy = Math.max(...quizHistory.map(q => q.accuracy));
    const totalQuestions = quizHistory.reduce((a, q) => a + q.numQuestions, 0);
    const totalTime = quizHistory.reduce((a, q) => a + q.totalTime, 0);
    return { avgAccuracy, bestAccuracy, totalQuestions, totalTime, attempts: quizHistory.length };
  }, [quizHistory]);

  // Build sparkline path from last 10 accuracy scores
  const sparkData = useMemo(() => {
    const last10 = [...quizHistory].slice(0, 10).reverse(); // oldest first for L→R
    if (last10.length < 2) return null;
    const W = 280, H = 60, pad = 6;
    const xs = last10.map((_, i) => pad + i * ((W - 2 * pad) / (last10.length - 1)));
    const ys = last10.map(q => H - pad - (q.accuracy / 100) * (H - 2 * pad));
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const area = `${d} L ${xs[xs.length - 1].toFixed(1)} ${H} L ${pad} ${H} Z`;
    return { d, area, last10, W, H };
  }, [quizHistory]);

  const accuracyColor = (acc) => {
    if (acc >= 80) return 'text-indigo-400';
    if (acc >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const badgeColor = (acc) => {
    if (acc >= 80) return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300';
    if (acc >= 50) return 'bg-amber-500/10 border-amber-500/25 text-amber-300';
    return 'bg-red-500/10 border-red-500/25 text-red-300';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
            <TrendingUp className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Quiz Analytics</h2>
            <p className="text-gray-500 font-mono text-[11px]">{quizHistory.length} attempt{quizHistory.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quizHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-500 hover:text-red-400 hover:border-red-500/30 font-mono text-[11px] transition-all"
            >
              <Trash2 size={10} /> Clear
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#1a1a1a] font-mono text-xs transition-all"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {quizHistory.length === 0 ? (
        <motion.div {...fadeUp()} className="bg-gray-50 dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-16 text-center">
          <BarChart3 size={40} className="text-gray-700 mx-auto mb-5" />
          <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">No quiz history yet</h3>
          <p className="text-gray-500 font-mono text-sm">Complete a quiz to see your analytics here.</p>
        </motion.div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Award,    label: 'Attempts',       value: stats.attempts,                  sub: 'total runs'     },
              { icon: Target,   label: 'Avg Accuracy',   value: `${stats.avgAccuracy}%`,         sub: 'across all'     },
              { icon: Zap,      label: 'Best Score',     value: `${stats.bestAccuracy}%`,        sub: 'personal best'  },
              { icon: Clock,    label: 'Study Time',     value: formatTime(stats.totalTime),     sub: 'total time'     },
            ].map(({ icon: Icon, label, value, sub }, i) => (
              <motion.div key={label} {...fadeUp(i * 0.06)} className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-5 hover:border-indigo-500/20 transition-colors shadow-sm">
                <Icon size={14} className="text-indigo-500 dark:text-indigo-400 mb-3" />
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{value}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Accuracy trend sparkline */}
          {sparkData && (
            <motion.div {...fadeUp(0.1)} className="bg-gray-50 dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-6 mb-8">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={12} className="text-indigo-400" /> Accuracy Trend — Last {sparkData.last10.length} Attempts
              </p>
              <div className="relative w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${sparkData.W} ${sparkData.H}`}
                  className="w-full"
                  style={{ height: 80 }}
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(pct => {
                    const y = sparkData.H - 6 - (pct / 100) * (sparkData.H - 12);
                    return (
                      <line key={pct} x1="0" y1={y.toFixed(1)} x2={sparkData.W} y2={y.toFixed(1)}
                        stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" strokeDasharray="4 3" />
                    );
                  })}
                  {/* Area fill */}
                  <path d={sparkData.area} fill="url(#sparkGrad)" opacity="0.35" />
                  {/* Line */}
                  <path d={sparkData.d} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots */}
                  {sparkData.last10.map((q, i) => {
                    const x = 6 + i * ((sparkData.W - 12) / (sparkData.last10.length - 1));
                    const y = sparkData.H - 6 - (q.accuracy / 100) * (sparkData.H - 12);
                    return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill="#6366f1" />;
                  })}
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between mt-1 px-1">
                {sparkData.last10.map((q, i) => (
                  <span key={i} className="font-mono text-[9px] text-gray-700">#{quizHistory.length - i < 1 ? 1 : quizHistory.length - sparkData.last10.length + i + 1}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* History list */}
          <motion.div {...fadeUp(0.15)} className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between">
              <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Attempt History</span>
              <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600">{quizHistory.length} record{quizHistory.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#141414] max-h-[480px] overflow-y-auto">
              {quizHistory.map((attempt, i) => (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.03)}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors"
                >
                  {/* Rank */}
                  <span className="font-mono text-xs text-gray-700 w-6 shrink-0">#{i + 1}</span>

                  {/* Accuracy ring mini */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3.5" />
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke={attempt.accuracy >= 80 ? '#6366f1' : attempt.accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3.5"
                        strokeDasharray={`${(attempt.accuracy / 100) * 88} 88`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-gray-700 dark:text-white">
                      {attempt.accuracy}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{attempt.subject}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] ${badgeColor(attempt.accuracy)}`}>
                        {attempt.accuracy >= 80 ? '🏆' : attempt.accuracy >= 50 ? '📈' : '📉'} {attempt.accuracy}%
                      </span>
                      <span className="font-mono text-[10px] text-gray-600 dark:text-gray-500 border border-gray-300 dark:border-[#222] px-1.5 py-0.5 rounded">{attempt.examType}</span>
                      <span className="font-mono text-[10px] text-gray-500">{attempt.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-gray-500 flex-wrap">
                      <span className="text-green-600 dark:text-green-500">{attempt.correct}✓</span>
                      <span className="text-red-500">{attempt.incorrect}✗</span>
                      <span className="text-gray-400">{attempt.skipped} skip</span>
                      <span className="text-gray-500">⏱ {formatTime(attempt.totalTime)}</span>
                      <span className="text-gray-500">{attempt.numQuestions}Q</span>
                    </div>
                  </div>

                  {/* Date */}
                  <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600 shrink-0 text-right hidden sm:block">
                    {formatDate(attempt.date)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPanel;
