import React, { useState, useEffect, useCallback } from 'react';
import { Settings, XCircle, BrainCircuit, Timer, RotateCcw, Maximize, Minimize, BarChart3, Clock, Target, Award, CheckCircle2, Zap, RefreshCw, TrendingUp } from 'lucide-react';
import MathText from './MathText';
import confetti from 'canvas-confetti';

const QuizTab = ({ files, subject, isFullscreen, toggleFullscreen, mainContainerRef, onQuizComplete, isOffline = false }) => {
  const [quizConfig, setQuizConfig] = useState({ examType: 'JEE Main', difficulty: 'Medium', numQuestions: 10 });
  const [quizData, setQuizData] = useState(() => {
    try {
      const cached = localStorage.getItem('edunest_cached_quiz');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [isCachedQuiz, setIsCachedQuiz] = useState(() => {
    try { return !!localStorage.getItem('edunest_cached_quiz'); } catch { return false; }
  });
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [quizLoadingStatus, setQuizLoadingStatus] = useState('> Fetching syllabus parameters...');
  const [quizErrorMsg, setQuizErrorMsg] = useState('');
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    let interval;
    if (quizData && quizData.length > 0 && !submittedAnswers[currentMcqIndex] && !isQuizFinished && !isReviewMode) {
      interval = setInterval(() => setQuestionTimes(prev => ({ ...prev, [currentMcqIndex]: (prev[currentMcqIndex] || 0) + 1 })), 1000);
    }
    return () => clearInterval(interval);
  }, [quizData, currentMcqIndex, submittedAnswers, isQuizFinished, isReviewMode]);

  const handleGenerateQuiz = async () => {
    // Guard: files are lost after a page refresh — they can't be stored in localStorage.
    // Show a clear error instead of silently sending empty FormData to the backend.
    if (!files || files.length === 0) {
      setQuizData([]);
      setQuizErrorMsg(
        "No files found. Browser sessions cannot retain uploaded files after a refresh.\n\n" +
        "Please go back to the Workshop (use the Back button in the navbar) and re-upload your study material to generate a new quiz."
      );
      return;
    }

    setIsQuizGenerating(true);
    setQuizErrorMsg("");
    setQuizLoadingStatus("Generating Quiz...");

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("subject", subject);
    formData.append("exam_type", quizConfig.examType);
    formData.append("difficulty", quizConfig.difficulty);
    formData.append("num_questions", quizConfig.numQuestions);

    try {
      const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      const response = await fetch(`${apiBase}/api/generate-quiz`, { method: "POST", body: formData });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Server Status: ${response.status}\nMessage: ${errorText}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.detail) {
            errorMsg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
          } else if (parsed.message) {
            errorMsg = parsed.message;
          }
        } catch (e) { }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const finalData = data?.payload?.mcqs || data?.data?.mcqs || data?.mcqs || data?.data || data;

      if (Array.isArray(finalData) && finalData.length > 0) {
        setQuizLoadingStatus("Compilation Complete");
        setTimeout(() => {
          setQuizData(finalData);
          setIsCachedQuiz(false);
          // Persist quiz for offline access
          try { localStorage.setItem('edunest_cached_quiz', JSON.stringify(finalData)); } catch {}
          setSubmittedAnswers({}); setSelectedOptions({}); setQuestionTimes({}); setIsQuizFinished(false); setCurrentMcqIndex(0);
          setIsReviewMode(false);
          setIsQuizGenerating(false);
        }, 1000);
      } else {
        throw new Error("Insufficient text density. The AI could not find enough readable content to generate a quiz.");
      }

    } catch (error) {
      setQuizLoadingStatus("Error: cd .. && retry");
      setTimeout(() => {
        setQuizData([]);
        setQuizErrorMsg(error.message);
        setIsQuizGenerating(false);
      }, 1000);
    }
  };

  const getQuizStats = () => {
    if (!quizData || quizData.length === 0) return null;
    let correct = 0, incorrect = 0, skipped = 0, score = 0, totalTime = 0, maxScore = 0;

    quizData.forEach((q, i) => {
      totalTime += (questionTimes[i] || 0);
      const userOpts = selectedOptions[i] || [];
      const isSkipped = !submittedAnswers[i] || userOpts.length === 0 || (q.type === 'numerical' && !userOpts[0]);

      maxScore += 4;

      if (isSkipped) {
        skipped++;
        return;
      }

      let isCorrect = false;

      if (q.type === 'numerical') {
        const correctVal = parseFloat(q.correct_answer);
        const userVal = parseFloat(userOpts[0]);
        isCorrect = (userVal === correctVal) || String(userOpts[0]).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
      } else {
        const correctOpts = q.correct_indices || [];
        isCorrect = userOpts.length === correctOpts.length && userOpts.every(val => correctOpts.includes(val));
      }

      if (isCorrect) {
        correct++; score += 4;
      } else {
        incorrect++;
      }
    });

    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    return { correct, incorrect, skipped, score, maxScore, totalTime, accuracy };
  };

  // Fire confetti + notify parent when quiz finishes
  const handleQuizFinish = useCallback(() => {
    setIsQuizFinished(true);
    const stats = getQuizStats();
    if (stats && stats.accuracy >= 80) {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ['#6366f1', '#a78bfa', '#38bdf8', '#ffffff'] });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, angle: 120 }), 300);
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, angle: 60 }), 600);
    }
    if (onQuizComplete && stats) {
      onQuizComplete({
        date: new Date().toISOString(),
        subject,
        examType: quizConfig.examType,
        difficulty: quizConfig.difficulty,
        score: stats.score,
        maxScore: stats.maxScore,
        accuracy: stats.accuracy,
        correct: stats.correct,
        incorrect: stats.incorrect,
        skipped: stats.skipped,
        totalTime: stats.totalTime,
        numQuestions: quizData.length,
      });
    }
  }, [quizData, selectedOptions, submittedAnswers, questionTimes, subject, quizConfig, onQuizComplete]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl mx-auto">
      {!quizData ? (
        <div className="bg-white dark:bg-[#121212] p-8 md:p-10 border border-gray-200 dark:border-[#262626] rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#262626] rounded-md"><Settings className="text-gray-600 dark:text-gray-400" size={20} /></div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Configure Practice Test</h2>
          </div>
          {/* ── Config grid ──────────────────────────────────────── */}
          <div className="flex flex-col gap-8 mb-10">

            {/* Exam Pattern */}
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
                Exam_Pattern
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'JEE Main', color: 'indigo' },
                  { value: 'JEE Advanced', color: 'purple' },
                  { value: 'NEET', color: 'emerald' },
                ].map(({ value, color }) => {
                  const active = quizConfig.examType === value;
                  const styles = {
                    indigo: { btn: active ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.15)]' : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:border-indigo-500/30 hover:text-indigo-300' },
                    purple: { btn: active ? 'border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.15)]' : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:border-purple-500/30 hover:text-purple-300' },
                    emerald: { btn: active ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.15)]' : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:border-emerald-500/30 hover:text-emerald-300' },
                  };
                  return (
                    <button
                      key={value}
                      onClick={() => setQuizConfig({ ...quizConfig, examType: value })}
                      className={`relative flex items-center gap-3 px-5 py-3.5 rounded-xl border font-semibold text-sm transition-all duration-200 ${styles[color].btn}`}
                    >
                      {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
                Complexity_Level
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'Easy', icon: '◎', desc: 'Concept recall', color: 'green' },
                  { value: 'Medium', icon: '◑', desc: 'Application based', color: 'amber' },
                  { value: 'Hard', icon: '●', desc: 'Problem solving', color: 'red' },
                ].map(({ value, icon, desc, color }) => {
                  const active = quizConfig.difficulty === value;
                  const styles = {
                    green: { btn: active ? 'border-green-500/50 bg-green-500/10 text-green-300 shadow-[0_0_16px_rgba(34,197,94,0.15)]' : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:border-green-500/30 hover:text-green-300', icon: 'text-green-400' },
                    amber: { btn: active ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.15)]' : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:border-amber-500/30 hover:text-amber-300', icon: 'text-amber-400' },
                    red: { btn: active ? 'border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.15)]' : 'border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:border-red-500/30 hover:text-red-300', icon: 'text-red-400' },
                  };
                  return (
                    <button
                      key={value}
                      onClick={() => setQuizConfig({ ...quizConfig, difficulty: value })}
                      className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border font-semibold text-sm transition-all duration-200 ${styles[color].btn}`}
                    >
                      <span className={`font-mono text-base leading-none ${active ? '' : styles[color].icon}`}>{icon}</span>
                      <span className="flex flex-col items-start gap-0.5">
                        <span>{value}</span>
                        <span className="font-mono text-[10px] opacity-50 font-normal">{desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
                #_Questions
              </label>
              <div className="flex items-center gap-4">
                {/* Stepper — keyboard arrow up/down supported */}
                <div
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') { e.preventDefault(); setQuizConfig(c => ({ ...c, numQuestions: Math.min(50, (parseInt(c.numQuestions) || 1) + 1) })); }
                    if (e.key === 'ArrowDown') { e.preventDefault(); setQuizConfig(c => ({ ...c, numQuestions: Math.max(1, (parseInt(c.numQuestions) || 1) - 1) })); }
                  }}
                  className="flex items-center border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0f0f0f] rounded-xl overflow-hidden focus:outline-none focus:border-indigo-500/40 transition-colors"
                >
                  <button
                    onClick={() => setQuizConfig(c => ({ ...c, numQuestions: Math.max(1, (parseInt(c.numQuestions) || 1) - 1) }))}
                    className="px-5 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-[#1a1a1a] font-mono text-xl transition-colors border-r border-gray-200 dark:border-[#262626] select-none"
                  >−</button>
                  <span className="w-16 text-center font-black text-2xl text-gray-900 dark:text-white font-mono tracking-tight select-none py-2">
                    {quizConfig.numQuestions}
                  </span>
                  <button
                    onClick={() => setQuizConfig(c => ({ ...c, numQuestions: Math.min(50, (parseInt(c.numQuestions) || 1) + 1) }))}
                    className="px-5 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-[#1a1a1a] font-mono text-xl transition-colors border-l border-gray-200 dark:border-[#262626] select-none"
                  >+</button>
                </div>
                <span className="font-mono text-xs text-gray-600">↑ ↓ keys work too</span>
              </div>
            </div>

          </div>

          {/* Offline notice when no cached quiz is available */}
          {isOffline && !quizData && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/8 border border-red-500/20 flex items-start gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-400 shrink-0 mt-0.5">
                <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <p className="text-red-400 font-semibold text-xs">Offline — Quiz generation unavailable</p>
                <p className="text-gray-500 text-xs mt-0.5">Connect to the internet to generate a new quiz. No cached quiz found.</p>
              </div>
            </div>
          )}

          {/* Offline notice with cached quiz available */}
          {isOffline && quizData && isCachedQuiz && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-amber-400 font-semibold text-xs">Offline — Showing cached quiz</p>
                <p className="text-gray-500 text-xs mt-0.5">You can review your last quiz. Connect to generate a new one.</p>
              </div>
            </div>
          )}

          <button onClick={handleGenerateQuiz} disabled={isQuizGenerating || isOffline} className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isOffline
              ? 'bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50'
          }`}>
            {isQuizGenerating ? <span className="font-mono">{quizLoadingStatus}</span> : isOffline ? 'Offline — Cannot Generate' : 'Execute Test Run'}
          </button>

          {/* Show cached quiz button when offline + cache exists */}
          {isOffline && isCachedQuiz && quizData && (
            <button
              onClick={() => { setSubmittedAnswers({}); setSelectedOptions({}); setQuestionTimes({}); setIsQuizFinished(false); setCurrentMcqIndex(0); setIsReviewMode(false); }}
              className="w-full mt-3 py-3 rounded-xl font-bold text-sm bg-white dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 hover:border-indigo-400/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all"
            >
              Review Cached Quiz
            </button>
          )}
        </div>
      ) : quizData.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] p-10 md:p-16 border border-gray-200 dark:border-[#262626] rounded-xl text-center">
          <XCircle size={40} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Compilation Error</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto font-mono">{quizErrorMsg}</p>
          <button onClick={() => setQuizData(null)} className="px-8 py-3 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#262626] text-gray-900 dark:text-white rounded-md font-mono text-sm hover:border-gray-300 dark:border-[#404040] transition-colors">cd .. && retry</button>
        </div>
      ) : isQuizFinished ? (
        <div className="animate-in slide-in-from-bottom-8 duration-500">
          {isReviewMode ? (
            <div className="bg-white dark:bg-[#121212] p-6 md:p-10 rounded-xl border border-gray-200 dark:border-[#262626] shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
              <div className="flex justify-between items-center mb-10 border-b border-gray-200 dark:border-[#262626] pb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight"><BrainCircuit className="text-indigo-500" /> Test Review</h2>
                <button onClick={() => setIsReviewMode(false)} className="px-4 py-2 bg-[#fafafa] dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 rounded-md font-mono text-xs hover:border-gray-500 hover:text-gray-900 dark:text-white transition-colors flex items-center gap-2">
                  &lt; Back to Score
                </button>
              </div>

              <div className="flex flex-col gap-10">
                {quizData.map((q, i) => {
                  const userOpts = selectedOptions[i] || [];
                  const isSkipped = !submittedAnswers[i] || userOpts.length === 0 || (q.type === 'numerical' && !userOpts[0]);

                  return (
                    <div key={i} className="bg-[#fafafa] dark:bg-[#0a0a0a] p-6 md:p-8 rounded-lg border border-gray-200 dark:border-[#262626]">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-gray-500 tracking-widest text-xs">Question_{i + 1}</div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded text-gray-600 dark:text-gray-400 font-mono text-[10px]">
                            <Timer size={10} className="text-indigo-400" /> {formatTime(questionTimes[i] || 0)}
                          </div>
                        </div>
                        {isSkipped && <span className="px-3 py-1 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#262626] text-gray-500 rounded-sm text-[10px] font-mono uppercase">Skipped</span>}
                      </div>

                      <div className="text-base font-sans text-gray-800 dark:text-gray-200 mb-8 leading-relaxed">
                        <MathText content={q.question} />
                      </div>

                      {q.type === 'numerical' ? (
                        <div className="flex flex-col gap-4 mb-8">
                          <div className="p-4 rounded-md bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] flex items-center gap-4">
                            <span className="text-gray-500 font-mono text-xs uppercase">Your_Answer:</span>
                            <span className={`font-mono font-bold text-lg ${isSkipped ? 'text-gray-600 italic' : 'text-gray-800 dark:text-gray-200'}`}>
                              {isSkipped ? 'null' : userOpts[0]}
                            </span>
                          </div>
                          <div className="p-4 rounded-md bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
                            <span className="text-emerald-500/60 font-mono text-xs uppercase">Expected:</span>
                            <span className="font-mono font-bold text-lg text-emerald-400">{q.correct_answer}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 mb-8">
                          {(q.options || []).map((opt, optIdx) => {
                            const isUserSelected = userOpts.includes(optIdx);
                            const isActuallyCorrect = (q.correct_indices || []).includes(optIdx);

                            let btnStyle = "bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] opacity-50";
                            let indicatorStyle = "bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-[#333333]";
                            let textStyle = "text-gray-700 dark:text-gray-300";

                            if (isActuallyCorrect) {
                              btnStyle = "bg-green-950/20 border-green-500/50";
                              indicatorStyle = "bg-green-500 text-white dark:text-black font-bold border-transparent";
                              textStyle = "text-gray-900 dark:text-white";
                            }
                            else if (isUserSelected && !isActuallyCorrect) {
                              btnStyle = "bg-red-950/20 border-red-500/50";
                              indicatorStyle = "bg-red-500 text-gray-900 dark:text-white font-bold border-transparent";
                              textStyle = "text-gray-500 line-through opacity-70";
                            }

                            return (
                              <div key={optIdx} className={`p-4 rounded-lg flex items-center gap-4 transition-all duration-200 ${btnStyle}`}>
                                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-mono text-xs transition-colors duration-300 ${indicatorStyle}`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <div className={`flex-1 w-full overflow-x-auto text-sm font-sans ${textStyle}`}>
                                  <MathText content={opt} />
                                </div>
                                {isActuallyCorrect && <CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" />}
                                {!isActuallyCorrect && isUserSelected && <XCircle className="text-red-500 shrink-0 w-5 h-5" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="bg-blue-50 dark:bg-[#0a0a0a] border-l-4 border-blue-500 p-4 mt-6 rounded-r-md font-mono text-sm">
                        <div className="font-mono text-xs text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                          {'>_ '} EXECUTION_LOG: EXPLANATION
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                          <MathText content={q.explanation} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center">
                <button onClick={() => {
                  if (mainContainerRef.current) mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="px-6 py-2 bg-[#fafafa] dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 rounded-md font-mono text-xs hover:border-gray-500 hover:text-gray-900 dark:text-white transition-colors">
                  ^ Scroll to Top
                </button>
              </div>
            </div>
          ) : showAnalytics ? (
            // ── Per-question analytics bar chart ───────────────────────────
            (() => {
              const maxT = Math.max(...quizData.map((_, i) => questionTimes[i] || 0), 1);
              return (
                <div className="bg-white dark:bg-[#121212] p-8 md:p-10 rounded-xl border border-gray-200 dark:border-[#262626] shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><TrendingUp className="text-indigo-400" size={22} /> Per-Question Analytics</h2>
                    <button onClick={() => setShowAnalytics(false)} className="px-4 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 rounded-md font-mono text-xs hover:text-gray-900 dark:text-white hover:border-gray-300 dark:border-[#404040] transition-colors">&lt; Back</button>
                  </div>
                  <div className="space-y-3">
                    {quizData.map((q, i) => {
                      const userOpts = selectedOptions[i] || [];
                      const isSkipped = !submittedAnswers[i] || userOpts.length === 0;
                      let isCorrect = false;
                      if (!isSkipped) {
                        if (q.type === 'numerical') {
                          isCorrect = String(userOpts[0]).trim() === String(q.correct_answer).trim();
                        } else {
                          const c = q.correct_indices || [];
                          isCorrect = userOpts.length === c.length && userOpts.every(v => c.includes(v));
                        }
                      }
                      const t = questionTimes[i] || 0;
                      const widthPct = Math.round((t / maxT) * 100);
                      const barColor = isSkipped ? '#71717a' : isCorrect ? '#22c55e' : '#ef4444';
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <span className="font-mono text-xs text-gray-500 w-6 shrink-0">Q{i + 1}</span>
                          <div className="flex-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-full h-5 overflow-hidden relative">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${widthPct}%`, backgroundColor: barColor, opacity: 0.85 }}
                            />
                          </div>
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-400 w-12 text-right shrink-0">{formatTime(t)}</span>
                          <span className="text-xs shrink-0">
                            {isSkipped ? '⏭' : isCorrect ? '✅' : '❌'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-6 text-center font-mono text-[11px] text-gray-600">Bar width = relative time spent · Green = correct · Red = wrong · Gray = skipped</p>
                </div>
              );
            })()
          ) : (() => {
            const stats = getQuizStats();
            let customMessage = 'Trace logs analyzed. Time to review the documentation and try again!';
            if (stats.accuracy >= 80) customMessage = 'Outstanding execution! Ready for the real deal. 🎉';
            else if (stats.accuracy >= 50) customMessage = 'Solid run! A little more optimization and you are there.';

            return (
              <div className="bg-white dark:bg-[#121212] p-10 md:p-16 rounded-xl border border-gray-200 dark:border-[#262626] text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none"></div>
                <Award size={40} className="text-indigo-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Execution Finished</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-2">{customMessage}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-12">Performance analysis for profile {quizConfig.examType}</p>

                {/* Score ring */}
                <div className="flex justify-center mb-10">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" className="text-gray-200 dark:text-[#262626]" stroke="currentColor" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={stats.accuracy >= 80 ? '#6366f1' : stats.accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${stats.accuracy} ${100 - stats.accuracy}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.accuracy}%</span>
                      <span className="text-[10px] font-mono text-gray-500">accuracy</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-gray-200 dark:border-[#262626] flex flex-col items-center shadow-sm">
                    <div className="text-gray-500 font-mono text-xs uppercase mb-3 flex items-center gap-2"><Target size={14} /> Score</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.score} <span className="text-sm text-gray-400 font-mono font-normal">/ {stats.maxScore}</span></div>
                  </div>
                  <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-gray-200 dark:border-[#262626] flex flex-col items-center shadow-sm">
                    <div className="text-gray-500 font-mono text-xs uppercase mb-3 flex items-center gap-2"><BarChart3 size={14} /> Accuracy</div>
                    <div className={`text-3xl font-bold ${stats.accuracy >= 80 ? 'text-indigo-500 dark:text-indigo-400' : stats.accuracy >= 50 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>{stats.accuracy}%</div>
                  </div>
                  <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-gray-200 dark:border-[#262626] flex flex-col items-center shadow-sm">
                    <div className="text-gray-500 font-mono text-xs uppercase mb-3 flex items-center gap-2"><Clock size={14} /> Total Time</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatTime(stats.totalTime)}</div>
                  </div>
                  <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-gray-200 dark:border-[#262626] flex flex-col items-center shadow-sm">
                    <div className="text-gray-500 font-mono text-xs uppercase mb-3 flex items-center gap-2"><Zap size={14} /> Avg Time</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatTime(Math.round(stats.totalTime / quizData.length))}</div>
                  </div>
                </div>

                <div className="flex justify-center gap-8 mb-12 text-sm font-mono text-gray-500">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="text-gray-900 dark:text-white">{stats.correct}</span> Passed</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-gray-900 dark:text-white">{stats.incorrect}</span> Failed</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-[#404040]"></span><span className="text-gray-900 dark:text-white">{stats.skipped}</span> Ignored</div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => setShowAnalytics(true)} className="px-8 py-3 bg-white dark:bg-[#0a0a0a] border border-indigo-400/40 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-xl font-mono text-sm hover:border-indigo-500/60 hover:bg-indigo-50 dark:hover:text-indigo-200 dark:hover:border-indigo-500/60 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <TrendingUp size={14} /> Question Analytics
                  </button>
                  <button onClick={() => setIsReviewMode(true)} className="px-8 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 rounded-xl font-mono text-sm hover:border-gray-400 dark:hover:border-[#404040] hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm">
                    View Trace Logs
                  </button>
                  <button onClick={() => {
                    // Clear quiz data from memory AND localStorage so that
                    // switching tabs and returning does not reload the old quiz.
                    setQuizData(null);
                    setIsCachedQuiz(false);
                    try { localStorage.removeItem('edunest_cached_quiz'); } catch {}
                    if (isFullscreen) toggleFullscreen();
                    setIsReviewMode(false);
                    setShowAnalytics(false);
                  }} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
                    Initialize New Run
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-[#262626] overflow-hidden shadow-2xl relative">
          <div className="flex justify-between items-center bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-[#262626] p-3 px-4">
            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <button onClick={toggleFullscreen} className="text-gray-500 hover:text-gray-900 dark:text-white transition-colors">
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            </div>
            <div className="font-mono text-[10px] md:text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Task {currentMcqIndex + 1}/{quizData.length}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#fafafa] dark:bg-[#0a0a0a] rounded border border-gray-200 dark:border-[#262626] font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
              <Timer size={12} className="text-gray-500 animate-pulse" /> {formatTime(questionTimes[currentMcqIndex] || 0)}
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="text-lg md:text-xl font-sans text-gray-800 dark:text-gray-200 mb-10 leading-relaxed max-w-3xl">
              <MathText content={quizData[currentMcqIndex]?.question || "Missing question content"} />
            </div>

            {quizData[currentMcqIndex].type === 'numerical' ? (
              <div className="mb-10 p-8 bg-[#fafafa] dark:bg-[#0a0a0a] rounded-md border border-gray-200 dark:border-[#262626] text-center relative overflow-hidden">
                {(() => {
                  const isSubmitted = submittedAnswers[currentMcqIndex];
                  const userVal = (selectedOptions[currentMcqIndex] || [])[0];
                  const correctVal = quizData[currentMcqIndex].correct_answer;
                  const isCorrect = userVal !== undefined && (parseFloat(userVal) === parseFloat(correctVal) || String(userVal).trim().toLowerCase() === String(correctVal).trim().toLowerCase());

                  let inputStyle = "bg-gray-50 dark:bg-[#171717] border-gray-200 dark:border-[#262626] focus:border-gray-500 text-gray-900 dark:text-white";
                  if (isSubmitted) {
                    if (isCorrect) inputStyle = "bg-emerald-500/5 border-emerald-500/50 text-emerald-400";
                    else inputStyle = "bg-red-500/5 border-red-500/50 text-red-400";
                  }

                  return (
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Input float or exact value</label>
                      <input type="text" placeholder="NaN" className={`border p-4 rounded-md text-center text-xl font-mono w-full max-w-[200px] md:max-w-xs outline-none transition-all duration-300 ${inputStyle}`} onChange={(e) => setSelectedOptions({ ...selectedOptions, [currentMcqIndex]: [e.target.value] })} value={userVal || ''} disabled={isSubmitted} />
                      {isSubmitted && !isCorrect && (
                        <div className="text-red-400 font-mono text-xs flex items-center gap-2 mt-2">
                          <XCircle size={14} /> Expected: {correctVal}
                        </div>
                      )}
                      {isSubmitted && isCorrect && (
                        <div className="text-emerald-400 font-mono text-xs flex items-center gap-2 mt-2">
                          <CheckCircle2 size={14} /> Test Passed
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 mb-10">
                {(quizData[currentMcqIndex]?.options || []).map((opt, i) => {
                  const isSelected = (selectedOptions[currentMcqIndex] || []).includes(i);
                  const isSubmitted = submittedAnswers[currentMcqIndex];
                  const isCorrect = (quizData[currentMcqIndex].correct_indices || []).includes(i);

                  let btnStyle = "bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] hover:border-gray-400 dark:hover:border-[#555] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]";
                  let indicatorStyle = "bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-[#333333]";
                  let textStyle = "text-gray-700 dark:text-gray-300";

                  if (!isSubmitted && isSelected) {
                    btnStyle = "bg-blue-900/10 border-blue-500/50";
                    indicatorStyle = "bg-blue-900/50 text-blue-200 border-transparent";
                  } else if (isSubmitted) {
                    if (isCorrect) {
                      btnStyle = "bg-green-950/20 border-green-500/50";
                      indicatorStyle = "bg-green-500 text-white dark:text-black font-bold border-transparent";
                      textStyle = "text-gray-900 dark:text-white";
                    }
                    else if (isSelected && !isCorrect) {
                      btnStyle = "bg-red-950/20 border-red-500/50";
                      indicatorStyle = "bg-red-500 text-gray-900 dark:text-white font-bold border-transparent";
                      textStyle = "text-gray-500 line-through opacity-70";
                    }
                    else {
                      btnStyle = "bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] opacity-50";
                    }
                  }

                  return (
                    <button key={i} onClick={() => {
                      if (isSubmitted) return;
                      let curr = selectedOptions[currentMcqIndex] || [];
                      if (quizData[currentMcqIndex].type === 'mcq') {
                        curr = [i];
                      } else {
                        curr = curr.includes(i) ? curr.filter(x => x !== i) : [...curr, i];
                      }
                      setSelectedOptions({ ...selectedOptions, [currentMcqIndex]: curr });
                    }} className={`p-4 rounded-lg text-left text-sm md:text-base border transition-all duration-200 cursor-pointer flex items-center gap-4 ${btnStyle}`}>
                      <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-mono text-xs transition-colors duration-300 ${indicatorStyle}`}>{String.fromCharCode(65 + i)}</div>
                      <div className={`flex-1 w-full overflow-x-auto font-sans ${textStyle}`}>
                        <MathText content={opt} />
                      </div>
                      {isSubmitted && isCorrect && <CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" />}
                      {isSubmitted && isSelected && !isCorrect && <XCircle className="text-red-500 shrink-0 w-5 h-5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {(() => {
              const isAnswerEmpty = quizData[currentMcqIndex].type === 'numerical'
                ? !selectedOptions[currentMcqIndex] || !selectedOptions[currentMcqIndex][0]
                : !selectedOptions[currentMcqIndex] || selectedOptions[currentMcqIndex].length === 0;

              return (
                <div className="flex gap-4 mb-8">
                  <button onClick={() => setSelectedOptions({ ...selectedOptions, [currentMcqIndex]: [] })} disabled={submittedAnswers[currentMcqIndex]} className="flex-1 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 py-3 rounded-xl font-mono text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"><RotateCcw size={14} /> Clear</button>
                  <button
                    onClick={() => setSubmittedAnswers({ ...submittedAnswers, [currentMcqIndex]: true })}
                    disabled={submittedAnswers[currentMcqIndex] || isAnswerEmpty}
                    className={`flex-[2] py-3 rounded-xl font-bold text-sm transition-all duration-300 ${submittedAnswers[currentMcqIndex] || isAnswerEmpty ? 'bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#262626] text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm'}`}
                  >
                    Assert Answer
                  </button>
                </div>
              );
            })()}

            {submittedAnswers[currentMcqIndex] && (
              <div className="bg-blue-50 dark:bg-[#0a0a0a] border-l-4 border-blue-500 p-4 mt-6 rounded-r-md font-mono text-sm mb-8 animate-in slide-in-from-top-4 duration-300">
                <div className="font-mono text-xs text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  {'>_ '} EXECUTION_LOG: EXPLANATION
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                  <MathText content={quizData[currentMcqIndex]?.explanation || "No explanation provided."} />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-gray-200 dark:border-[#262626] pt-6 font-mono">
              <button onClick={() => setCurrentMcqIndex(Math.max(0, currentMcqIndex - 1))} className="px-5 py-2.5 bg-transparent border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 rounded-xl text-xs disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-[#171717] hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-[#404040] transition-colors" disabled={currentMcqIndex === 0}>&lt; Prev</button>
              <button
                onClick={() => {
                  if (currentMcqIndex === quizData.length - 1) handleQuizFinish();
                  else setCurrentMcqIndex(currentMcqIndex + 1);
                }}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${currentMcqIndex === quizData.length - 1 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.3)]' : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm'}`}
              >
                {currentMcqIndex === quizData.length - 1 ? 'Finish Execution' : 'Next >'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTab;
