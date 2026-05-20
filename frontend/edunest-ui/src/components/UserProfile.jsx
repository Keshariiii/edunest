/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Mail, Calendar, Lock, LogOut, Edit3, Check, X, Loader2, AlertCircle, Shield, ArrowLeft, Flame, Zap, Hourglass, Target, Trash2 } from 'lucide-react';

// ─── Activity Streak Hook (converted from activity.js) ─────────────────────
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7));
}

function useStreak() {
  const [streak, setStreak] = useState(0);
  const [checkedDays, setCheckedDays] = useState([false, false, false, false, false, false, false]);

  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  const loadState = useCallback(() => {
    // Reset if new week
    const currentWeek = getWeekNumber();
    const savedWeek = localStorage.getItem('edunest_savedWeek');
    if (savedWeek !== null && parseInt(savedWeek) !== currentWeek) {
      for (let i = 0; i < 7; i++) localStorage.removeItem('edunest_day-' + i);
      localStorage.setItem('edunest_savedWeek', currentWeek);
    } else if (savedWeek === null) {
      localStorage.setItem('edunest_savedWeek', currentWeek);
    }

    // Load checked days
    const days = [];
    for (let i = 0; i < 7; i++) days.push(localStorage.getItem('edunest_day-' + i) === 'checked');
    setCheckedDays(days);
    setStreak(parseInt(localStorage.getItem('edunest_streak')) || 0);
  }, []);

  // Auto check-in today on mount
  useEffect(() => {
    loadState();
    if (localStorage.getItem('edunest_day-' + todayIndex) !== 'checked') {
      localStorage.setItem('edunest_day-' + todayIndex, 'checked');
      let s = parseInt(localStorage.getItem('edunest_streak')) || 0;
      const lastDay = localStorage.getItem('edunest_lastDay');
      if (lastDay === null) { s = 1; }
      else {
        const diff = todayIndex - parseInt(lastDay);
        s = (diff === 1 || diff === -6) ? s + 1 : 1;
      }
      localStorage.setItem('edunest_streak', s);
      localStorage.setItem('edunest_lastDay', todayIndex);
      loadState();
    }
  }, []);

  return { streak, checkedDays, todayIndex };
}

// ─── Streak Card Component ──────────────────────────────────────────────────
function ActivityStreak() {
  const { streak, checkedDays, todayIndex } = useStreak();
  return (
    <div className="pt-4 border-t border-gray-100 dark:border-[#1e1e1e]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap size={12} className="text-amber-500" /> Weekly Activity
        </h4>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <Flame size={13} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">{streak} day streak</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, i) => {
          const isToday = i === todayIndex;
          const isChecked = checkedDays[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className={`text-[10px] font-mono font-semibold ${isToday ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isChecked
                  ? 'bg-emerald-500 shadow-md shadow-emerald-500/30 scale-105'
                  : isToday
                    ? 'bg-emerald-500/10 border-2 border-dashed border-emerald-400/50'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626]'
              }`}>
                {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Exam Countdown Component ───────────────────────────────────────────────
const EXAM_OPTIONS = [
  { value: 'JEE Main',     color: 'indigo', icon: '⚡' },
  { value: 'JEE Advanced', color: 'purple', icon: '🔬' },
  { value: 'NEET',         color: 'emerald', icon: '🧬' },
];

function ExamCountdown() {
  const [examName, setExamName] = useState(() => localStorage.getItem('edunest_target_exam') || '');
  const [examDate, setExamDate] = useState(() => localStorage.getItem('edunest_exam_date') || '');
  const [isEditing, setIsEditing] = useState(false);
  const [draftExam, setDraftExam] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, mins: 0, secs: 0, total: 0 });
  // Calendar navigation state (must be top-level hooks)
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  // Live ticker — updates every second
  useEffect(() => {
    if (!examDate) return;
    const tick = () => {
      const diff = new Date(examDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, mins: 0, secs: 0, total: 0 });
        return;
      }
      setRemaining({
        days:  Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins:  Math.floor((diff / (1000 * 60)) % 60),
        secs:  Math.floor((diff / 1000) % 60),
        total: diff,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [examDate]);

  const handleSave = () => {
    if (!draftExam || !draftDate) return;
    setExamName(draftExam);
    setExamDate(draftDate);
    localStorage.setItem('edunest_target_exam', draftExam);
    localStorage.setItem('edunest_exam_date', draftDate);
    setIsEditing(false);
  };

  const handleClear = () => {
    setExamName('');
    setExamDate('');
    localStorage.removeItem('edunest_target_exam');
    localStorage.removeItem('edunest_exam_date');
    setIsEditing(false);
  };

  const openEdit = () => {
    setDraftExam(examName || EXAM_OPTIONS[0].value);
    setDraftDate(examDate || '');
    // Sync calendar view to the saved date or today
    const ref = examDate ? new Date(examDate + 'T00:00:00') : new Date();
    setViewYear(ref.getFullYear());
    setViewMonth(ref.getMonth());
    setIsEditing(true);
  };

  const examMeta = EXAM_OPTIONS.find(e => e.value === examName);
  const isPast = remaining.total <= 0 && examDate;


  return (
    <div className="pt-4 border-t border-gray-100 dark:border-[#1e1e1e]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Hourglass size={12} className="text-indigo-500" /> Exam Countdown
        </h4>
        {examName && !isEditing && (
          <button onClick={openEdit} className="p-1 rounded text-gray-400 hover:text-indigo-500 transition-colors">
            <Edit3 size={11} />
          </button>
        )}
      </div>

      {isEditing ? (
        /* ── Edit Mode ──────────────────────────────────────────── */
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Exam selector chips */}
          <div className="flex flex-wrap gap-2">
            {EXAM_OPTIONS.map(({ value, icon }) => (
              <button
                key={value}
                onClick={() => setDraftExam(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                  draftExam === value
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.12)]'
                    : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111] text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-[#444]'
                }`}
              >
                <span>{icon}</span> {value}
              </button>
            ))}
          </div>

          {/* Custom Calendar Picker */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sel = draftDate ? new Date(draftDate + 'T00:00:00') : null;

            const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const WDAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

            const firstDay = new Date(viewYear, viewMonth, 1);
            const startDay = (firstDay.getDay() + 6) % 7; // Mon=0
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

            const cells = [];
            for (let i = 0; i < startDay; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);

            const prevMonth = () => {
              if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
              else setViewMonth(m => m - 1);
            };
            const nextMonth = () => {
              if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
              else setViewMonth(m => m + 1);
            };

            const canGoPrev = new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

            const selectDay = (d) => {
              const dateObj = new Date(viewYear, viewMonth, d);
              if (dateObj < today) return;
              const yyyy = viewYear;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(d).padStart(2, '0');
              setDraftDate(`${yyyy}-${mm}-${dd}`);
            };

            return (
              <div className="rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
                {/* Month/Year header */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-[#1e1e1e]">
                  <button
                    type="button"
                    onClick={prevMonth}
                    disabled={!canGoPrev}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
                    {MONTHS[viewMonth]} {viewYear}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    ›
                  </button>
                </div>

                <div className="p-2.5">
                  {/* Day-of-week headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {WDAYS.map(d => (
                      <div key={d} className="text-center text-[9px] font-mono font-bold text-gray-400 dark:text-gray-600 uppercase py-1">{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                      if (day === null) return <div key={`e-${i}`} />;

                      const dateObj = new Date(viewYear, viewMonth, day);
                      const isPast = dateObj < today;
                      const isToday = dateObj.getTime() === today.getTime();
                      const isSelected = sel && dateObj.getTime() === sel.getTime();

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => selectDay(day)}
                          className={`
                            w-full aspect-square rounded-lg flex items-center justify-center
                            font-mono text-[11px] font-semibold transition-all duration-200
                            ${isPast
                              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                              : isSelected
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                                : isToday
                                  ? 'bg-white dark:bg-[#1a1a1a] text-indigo-500 ring-2 ring-indigo-500/40 font-bold'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-400 cursor-pointer'
                            }
                          `}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected date footer */}
                {draftDate && (
                  <div className="px-3 py-2 border-t border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#111] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500">Selected</span>
                    <span className="text-xs font-bold text-indigo-500 font-mono">
                      {new Date(draftDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!draftExam || !draftDate}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
            >
              Cancel
            </button>
            {examName && (
              <button
                onClick={handleClear}
                className="ml-auto px-3 py-2 text-red-500 text-xs font-mono hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>
        </div>
      ) : examName && examDate ? (
        /* ── Display Mode ───────────────────────────────────────── */
        <div className="animate-in fade-in duration-300">
          {/* Exam label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{examMeta?.icon || '📝'}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{examName}</span>
            <span className="text-[10px] font-mono text-gray-500 ml-auto">
              {new Date(examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {isPast ? (
            /* Exam day passed */
            <div className="text-center py-4 px-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-emerald-500 font-bold text-sm">🎉 Exam day has arrived!</p>
              <p className="text-[10px] font-mono text-gray-500 mt-1">All the best! You've got this.</p>
            </div>
          ) : (
            /* Countdown grid */
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Days',  value: remaining.days,  accent: 'text-indigo-500 dark:text-indigo-400' },
                { label: 'Hours', value: remaining.hours, accent: 'text-purple-500 dark:text-purple-400' },
                { label: 'Mins',  value: remaining.mins,  accent: 'text-sky-500 dark:text-sky-400' },
                { label: 'Secs',  value: remaining.secs,  accent: 'text-amber-500 dark:text-amber-400' },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-3 px-2 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e]"
                >
                  <span className={`text-2xl font-black font-mono tabular-nums leading-none ${accent}`}>
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 mt-1 uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── No exam set ────────────────────────────────────────── */
        <button
          onClick={openEdit}
          className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-[#333] text-gray-500 dark:text-gray-400 text-xs font-mono hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
        >
          <Target size={13} /> Set your target exam date
        </button>
      )}
    </div>
  );
}

export default function UserProfile({ user, token, onLogout, onUserUpdate, onBack }) {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete account state
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.trim() === user.username) {
      setEditing(false);
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      onUserUpdate?.(data.user);
      setSuccess('Username updated');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiBase}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        if (typeof detail === 'string') throw new Error(detail);
        if (Array.isArray(detail)) throw new Error(detail.map(d => d.msg?.replace('Value error, ', '') || d.msg).join('. '));
        throw new Error(JSON.stringify(detail));
      }
      setSuccess('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmWord !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to delete account');
      
      // Account deleted successfully, log out and redirect
      onLogout();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
            title="Back to Workspace"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 m-0">
          <Shield size={18} className="text-indigo-500" />
          Account Settings
        </h2>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-600 dark:text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">{success}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] rounded-2xl p-6 shadow-sm space-y-5">

        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-gray-900 dark:text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            {(user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <button onClick={handleUpdateUsername} disabled={loading} className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setEditing(false); setNewUsername(user?.username || ''); }} className="p-1.5 rounded-md bg-gray-200 dark:bg-[#222] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#333] transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{user?.username}</h3>
                <button onClick={() => setEditing(true)} className="p-1 rounded text-gray-400 hover:text-indigo-500 transition-colors">
                  <Edit3 size={12} />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-[#1e1e1e]">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0 font-mono text-xs">Email</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0 font-mono text-xs">Joined</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{joinDate}</span>
          </div>
        </div>

        {/* Activity Streak */}
        <ActivityStreak />

        {/* Exam Countdown */}
        <ExamCountdown />

        {/* Change Password */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#1e1e1e]">
          {!changingPassword ? (
            <button
              onClick={() => { setChangingPassword(true); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-indigo-500 transition-colors"
            >
              <Lock size={12} /> Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="password"
                placeholder="New password (min 8 chars, 1 uppercase, 1 digit)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); }}
                  className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Logout & Danger Zone */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#1e1e1e] flex flex-col gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors self-start"
          >
            <LogOut size={12} /> Sign Out
          </button>

          {!deletingAccount ? (
            <button
              onClick={() => { setDeletingAccount(true); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-xs font-mono text-red-500 hover:text-red-600 transition-colors self-start mt-4"
            >
              <AlertCircle size={12} /> Delete Account
            </button>
          ) : (
            <div className="mt-4 p-4 border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 rounded-xl space-y-3">
              <h4 className="text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={14} /> Danger Zone
              </h4>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 font-mono">
                This action is permanent and cannot be undone. All your generated materials will be lost.
              </p>
              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <input
                  type="password"
                  placeholder="Verify your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-red-200 dark:border-red-500/30 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  required
                />
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmWord}
                  onChange={(e) => setDeleteConfirmWord(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-red-200 dark:border-red-500/30 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 uppercase"
                  required
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading || deleteConfirmWord !== 'DELETE'}
                    className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : 'Permanently Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeletingAccount(false); setDeleteConfirmWord(''); setDeletePassword(''); }}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#222] text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-[#333] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
