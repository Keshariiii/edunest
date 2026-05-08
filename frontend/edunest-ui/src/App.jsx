import React, { useState, useEffect, useRef } from 'react';
import { Calculator, FileText, Layers, Minimize, BrainCircuit, AlertTriangle, RefreshCw, BookOpen, Tag } from 'lucide-react';
import { AppLoading, SlowNetworkBanner, OfflineBanner } from './components/SkeletonLoader';

import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import HeroSection from './components/HeroSection';
import FormulasTab from './components/FormulasTab';
import NotesTab from './components/NotesTab';
import FlashcardsTab from './components/FlashcardsTab';
import QuizTab from './components/QuizTab';
import AnalyticsPanel from './components/AnalyticsPanel';
import AuthView from './components/AuthView';
import UserProfile from './components/UserProfile';
import OfflinePage from './components/OfflinePage';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('EduNest render crash:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-10 p-8 bg-white dark:bg-[#121212] border border-red-500/30 rounded-xl max-w-2xl mx-auto text-left">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-400 shrink-0" size={22} />
            <h3 className="text-red-400 font-bold font-mono text-sm uppercase tracking-widest">Render Error — Results could not be displayed</h3>
          </div>
          <pre className="text-gray-600 dark:text-gray-400 font-mono text-xs whitespace-pre-wrap bg-[#fafafa] dark:bg-[#0a0a0a] p-4 rounded-md border border-gray-200 dark:border-[#262626] mb-6">
            {this.state.error?.message || 'Unknown rendering error'}
          </pre>
          <p className="text-gray-500 text-xs font-mono mb-6">This is usually caused by a malformed formula or special character in the AI output. Try uploading a clearer image/PDF or a different page.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-md font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Smart view initialisation — skip 'loading' flash when we already have a
  // cached session so results are immediately visible after a reconnect/refresh.
  const [view, setView] = useState(() => {
    const hasToken   = !!localStorage.getItem('edunest_access_token');
    const hasResults = !!localStorage.getItem('edunest_cached_results');
    if (hasToken && hasResults) return 'app';  // drop straight into results
    if (!hasToken)              return 'landing'; // no session — show landing
    return 'loading';                            // token but no results — verify
  });

  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('edunest_access_token'));
  const [authLoading, setAuthLoading] = useState(true);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [subject, setSubject] = useState(() => {
    try { return localStorage.getItem('edunest_subject') || ''; } catch { return ''; }
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(() => {
    try {
      const cached = localStorage.getItem('edunest_cached_results');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem('edunest_active_tab') || 'formulas'; } catch { return 'formulas'; }
  });
  // Track whether files are missing after a refresh (they can't be persisted)
  const [filesLostAfterRefresh, setFilesLostAfterRefresh] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [quizHistory, setQuizHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edunest_quiz_history') || '[]'); } catch { return []; }
  });
  const mainContainerRef = useRef(null);

  // Global Network Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3500);
      setUploadError(null);
      // NEVER redirect when results are already cached — just restore connectivity silently.
      const hasResults = !!localStorage.getItem('edunest_cached_results');
      if (hasResults) return;  // <- key guard: do nothing if user has materials
      if (view === 'landing' || view === 'loading') checkAuth();
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [view]);

  // Check Auth on Load — determines initial view
  // Extracted so it can also be called on reconnect
  const checkAuth = async () => {
    const storedToken = localStorage.getItem('edunest_access_token');
    if (!storedToken) {
      setView('landing');
      setAuthLoading(false);
      return;
    }

    const slowTimer = setTimeout(() => setSlowNetwork(true), 8000);

    try {
      const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      const res = await fetch(`${apiBase}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        // Only navigate if not already showing cached results
        // This prevents a reconnect/refresh from wiping the results view
        const hasResults = !!localStorage.getItem('edunest_cached_results');
        if (!hasResults) setView('app');
      } else {
        // Token truly invalid — clear everything including cached materials
        localStorage.removeItem('edunest_access_token');
        localStorage.removeItem('edunest_refresh_token');
        localStorage.removeItem('edunest_cached_results');
        localStorage.removeItem('edunest_subject');
        localStorage.removeItem('edunest_active_tab');
        setToken(null);
        setResults(null);
        setView('landing');
      }
    } catch (e) {
      console.error('Failed to check auth status:', e);
      // Network error during auth check — do NOT navigate away if results exist
      const hasResults = !!localStorage.getItem('edunest_cached_results');
      if (!hasResults) setView('landing');
    } finally {
      clearTimeout(slowTimer);
      setSlowNetwork(false);
      setAuthLoading(false);
    }
  };

  useEffect(() => { checkAuth(); }, []);

  const handleAuthSuccess = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setView('app');
  };

  const handleLogout = async () => {
    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
    if (token) {
      try {
        await fetch(`${apiBase}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) { console.error('Logout error:', e); }
    }
    localStorage.removeItem('edunest_access_token');
    localStorage.removeItem('edunest_refresh_token');
    localStorage.removeItem('edunest_cached_results');
    localStorage.removeItem('edunest_subject');
    localStorage.removeItem('edunest_active_tab');
    setUser(null);
    setToken(null);
    setResults(null);
    setSubject('');
    setFiles([]);
    setView('landing');
  };

  // Persist quiz history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('edunest_quiz_history', JSON.stringify(quizHistory));
  }, [quizHistory]);

  // Persist results, subject, and activeTab to localStorage
  useEffect(() => {
    if (results) {
      try { localStorage.setItem('edunest_cached_results', JSON.stringify(results)); } catch {}
    } else {
      localStorage.removeItem('edunest_cached_results');
    }
  }, [results]);

  useEffect(() => {
    if (subject) localStorage.setItem('edunest_subject', subject);
  }, [subject]);

  useEffect(() => {
    localStorage.setItem('edunest_active_tab', activeTab);
  }, [activeTab]);

  // Detect files lost after a refresh when results are cached but files array is empty
  useEffect(() => {
    if (results && files.length === 0) {
      setFilesLostAfterRefresh(true);
    } else {
      setFilesLostAfterRefresh(false);
    }
  }, [results, files]);

  const handleQuizComplete = (result) => {
    setQuizHistory(prev => [result, ...prev].slice(0, 50)); // keep last 50 attempts
  };

  // Persist theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      document.documentElement.requestFullscreen?.().catch(err => console.log('Fullscreen API error:', err));
    } else {
      setIsFullscreen(false);
      document.fullscreenElement && document.exitFullscreen?.().catch(err => console.log('Exit Fullscreen API error:', err));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerateBase = async () => {
    if (!subject || files.length === 0) return alert('Select subject and upload at least one file!');
    setLoading(true);
    setUploadError(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('subject', subject);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      const response = await fetch(`${apiBase}/api/generate-study-material`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Status: ${response.status}\nMessage: ${errorText}`);
      }

      const data = await response.json();
      if (data.error) { setUploadError(data.details); return; }
      setResults(data);
      setActiveTab('formulas');
    } catch (error) {
      console.error('Backend Error:', error);
      if (error.name === 'AbortError') {
        setUploadError("Request timed out after 60 seconds. Google's servers might be overloaded right now.");
      } else if (error.message === 'Failed to fetch') {
        setUploadError('BACKEND OFFLINE: Please ensure the FastAPI server is running on port 8000');
      } else if (error.message?.includes('429')) {
        setUploadError('API BUSY: Gemini free tier limit reached. Please wait 60 seconds and try again.');
      } else if (error.message?.includes('500')) {
        try {
          const jsonStr = error.message.split('Message: ')[1];
          const parsed = JSON.parse(jsonStr);
          setUploadError(parsed.detail || parsed.details || error.message);
        } catch (e) { setUploadError(error.message); }
      } else {
        setUploadError(error.message || 'An unknown error occurred while processing.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleRegenerateSection = async (sectionType) => {
    if (!files.length || !subject) return;
    setRegeneratingSection(sectionType);
    try {
      const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('subject', subject);
      formData.append('section_type', sectionType === 'notes' ? 'notes' : sectionType);
      const resp = await fetch(`${apiBase}/api/regenerate-section`, { method: 'POST', body: formData });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json();
      setResults(prev => ({
        ...prev,
        ...(sectionType === 'formulas' ? { formulas: data.data } : {}),
        ...(sectionType === 'notes' ? { short_notes: data.data } : {}),
        ...(sectionType === 'flashcards' ? { flashcards: data.data } : {}),
      }));
    } catch (e) {
      console.error('Regeneration failed:', e);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // ─── Derived flags ──────────────────────────────────────────────────────────
  const isLandingView = view === 'landing';
  const isAuthView = view === 'login' || view === 'register';
  const isProfileView = view === 'profile';
  const isWorkshopView = view === 'app';
  const inResults = results !== null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a] text-gray-800 dark:text-gray-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300 ease-in-out ${(inResults || isFullscreen) ? 'h-screen overflow-hidden print:h-auto print:overflow-visible' : 'min-h-screen'}`}>

      {/* ── FULL-SCREEN AUTH LOADING (token check in progress) ─────────── */}
      {view === 'loading' && <AppLoading message="Restoring your workspace" detail="Verifying your session…" />}

      {/* ── SLOW NETWORK BANNER ──────────────────────────────────────────── */}
      {slowNetwork && !isOffline && <SlowNetworkBanner onRetry={() => window.location.reload()} />}

      {/* ── OFFLINE BANNER ──────────────────────────────────────────────── */}
      {isOffline && <OfflineBanner />}

      {/* Fixed background decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none no-print">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-[160px]" />
      </div>

      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');

        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 4px; }

        @keyframes slideInFromRight { 0% { transform: translateX(80px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes slideInFromLeft  { 0% { transform: translateX(-80px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        .animate-slide-next { animation: slideInFromRight 0.4s cubic-bezier(0.25,1,0.5,1) forwards; }
        .animate-slide-prev { animation: slideInFromLeft  0.4s cubic-bezier(0.25,1,0.5,1) forwards; }

        .notebook-lines { background-image: repeating-linear-gradient(transparent,transparent 31px,rgba(148,163,184,0.3) 31px,rgba(148,163,184,0.3) 32px); background-size: 100% 32px; }
        .dark .notebook-lines { background-image: repeating-linear-gradient(transparent,transparent 31px,rgba(255,255,255,0.05) 31px,rgba(255,255,255,0.05) 32px); }
        .handwritten-text { font-family:'Caveat',cursive; font-size:clamp(1.4rem,5vw,1.8rem); line-height:2rem; letter-spacing:0.02em; }

        @media print {
          @page { size: auto; margin: 15mm; }
          body,html,#root,main { height:auto!important; min-height:auto!important; overflow:visible!important; position:static!important; display:block!important; padding:0!important; margin:0!important; -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
          nav,button,.no-print { display:none!important; }
          .printable-notebook { width:100%!important; background:white!important; color:black!important; box-shadow:none!important; border:none!important; margin:0!important; padding:0!important; font-family:'Times New Roman',Times,serif!important; height:auto!important; overflow:visible!important; }
          .printable-notebook * { color:black!important; text-shadow:none!important; background:transparent!important; border-color:#ccc!important; }
          .print-force-show { display:block!important; opacity:1!important; transform:none!important; animation:none!important; height:auto!important; overflow:visible!important; position:static!important; }
          .print-page-break { page-break-after:auto!important; margin-bottom:20px!important; border:transparent!important; box-shadow:none!important; overflow:visible!important; min-height:0!important; }
          h1,h2,h3,h4,h5,h6 { page-break-after:avoid!important; page-break-inside:avoid!important; }
          p,li { page-break-inside:avoid!important; }
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type="number"] { -moz-appearance:textfield; }

        @keyframes scan { 0% { left:-50%; } 100% { left:100%; } }

        /* ── Mobile Utilities ─────────────────────────────────────────── */
        /* Safe-area inset bottom for iPhone home bar */
        .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        /* Stop double-tap zoom on buttons without disabling pinch-to-zoom */
        button, a, label { touch-action: manipulation; }
        /* Overflow-protect math/code blocks on narrow screens */
        .katex-display, pre, code { overflow-x: auto; max-width: 100%; }
        /* Prevent text selection flash on rapid taps */
        button { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
        /* Smooth momentum scrolling inside scroll containers on iOS */
        .overflow-y-auto, .overflow-x-auto { -webkit-overflow-scrolling: touch; }
        /* Prevent pull-to-refresh in the results container on Android Chrome */
        main { overscroll-behavior-y: contain; }

        /* ── Dark-mode Markdown / Highlight Fixes ─────────────────────── */
        /* <mark> highlights — default browser yellow is unreadable in dark mode */
        mark, .math-content mark {
          background: linear-gradient(120deg, #fef08a 0%, #fde68a 100%);
          color: #1c1917;
          padding: 0.1em 0.25em;
          border-radius: 3px;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        .dark mark, .dark .math-content mark {
          background: linear-gradient(120deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.20) 100%);
          color: #fbbf24;
          box-shadow: 0 0 8px rgba(251,191,36,0.08);
        }
        /* Strong/bold inside notes — slightly brighter in dark mode */
        .dark .math-content strong { color: #f3f4f6; }
        /* Emphasis (italic) — subtle indigo tint in dark mode */
        .dark .math-content em { color: #a5b4fc; font-style: italic; }
        /* Inline code inside notes/flashcards */
        .math-content code {
          background: #f1f5f9; color: #334155;
          padding: 0.15em 0.4em; border-radius: 4px;
          font-size: 0.875em; font-family: ui-monospace, monospace;
        }
        .dark .math-content code {
          background: #1e293b; color: #e2e8f0;
        }
      `}</style>

      {/* Navbar — always visible, aware of fullscreen */}
      {!isAuthView && (
        <Navbar
          view={view}
          setView={setView}
          results={results}
          setResults={setResults}
          setFiles={setFiles}
          setSubject={setSubject}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          quizHistory={quizHistory}
          showAnalytics={showAnalytics}
          setShowAnalytics={setShowAnalytics}
          theme={theme}
          setTheme={setTheme}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main
        ref={mainContainerRef}
        className={`relative z-10 w-full print:overflow-visible print:block print:h-auto ${(inResults || isFullscreen) ? 'flex-1 overflow-y-auto' : ''} ${isFullscreen ? 'fixed inset-x-0 bottom-0 top-[56px] z-40 bg-[#fafafa] dark:bg-[#0a0a0a]' : (inResults ? 'pt-8 pb-8' : '')}`}
      >

        {/* ── ANALYTICS PANEL ───────────────────────────────────────────── */}
        {showAnalytics && !isFullscreen && (
          <div className="mx-auto w-full max-w-4xl px-6 pt-10 pb-20">
            <AnalyticsPanel
              quizHistory={quizHistory}
              onClearHistory={() => { setQuizHistory([]); }}
              onClose={() => setShowAnalytics(false)}
            />
          </div>
        )}

        {/* ── LANDING PAGE ──────────────────────────────────────────────── */}
        {isLandingView && !inResults && !showAnalytics && (
          isOffline
            ? <OfflinePage onRetry={() => window.location.reload()} />
            : <LandingPage onGetStarted={() => {
                if (user) setView('app');
                else setView('login');
              }} />
        )}

        {/* ── AUTHENTICATION ────────────────────────────────────────────── */}
        {isAuthView && !authLoading && (
          <AuthView
            onAuthSuccess={handleAuthSuccess}
            initialMode={view === 'login' ? 'login' : 'register'}
            onBack={() => setView('landing')}
          />
        )}

        {/* ── USER PROFILE ──────────────────────────────────────────────── */}
        {isProfileView && (
          <div className="mx-auto w-full max-w-4xl px-6 pt-24 pb-20">
            <UserProfile
              user={user}
              token={token}
              onLogout={handleLogout}
              onUserUpdate={(updatedUser) => setUser(updatedUser)}
              onBack={() => setView('app')}
            />
          </div>
        )}

        {/* ── WORKSPACE (Upload Tool) ───────────────────────────────────── */}
        {isWorkshopView && !inResults && !isFullscreen && !showAnalytics && (
          <div className="mx-auto w-full max-w-7xl px-6 pt-24 pb-20">
            <HeroSection
              subject={subject}
              setSubject={setSubject}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              handleDrop={handleDrop}
              files={files}
              setFiles={setFiles}
              removeFile={removeFile}
              uploadError={uploadError}
              loading={loading}
              handleGenerateBase={handleGenerateBase}
              onBack={() => setView('landing')}
              isOffline={isOffline}
            />
          </div>
        )}

        {/* ── RESULTS (Study Material) ─────────────────────────────────── */}
        {inResults && (
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
            <ErrorBoundary>
              <div className="mt-8 md:mt-10 transition-all duration-300">

                {results.error && (
                  <div className="no-print bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 md:p-6 mb-8 text-center animate-in fade-in flex flex-col items-center">
                    <AlertTriangle className="text-rose-500 mb-3" size={36} />
                    <h3 className="text-base md:text-lg font-bold text-rose-400 mb-1">Partial Generation Detected</h3>
                    <p className="text-rose-300 text-xs md:text-sm max-w-2xl">
                      {results.details || "The AI encountered a deeply complex file or reached its memory limits. Some tabs below might be empty. Try uploading fewer pages at once for a complete extraction."}
                    </p>
                  </div>
                )}

                {/* Chapter / Topic Metadata */}
                {results?.metadata?.chapter_title && (
                  <div className="no-print mb-6 bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-4 animate-in fade-in duration-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <BookOpen size={14} className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-900 dark:text-white font-bold text-sm mb-1.5">{results.metadata.chapter_title}</p>
                        {results.metadata.topics_covered?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {results.metadata.topics_covered.map(t => (
                              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                                <Tag size={8} /> {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics overlay inside results */}
                {showAnalytics && !isFullscreen && (
                  <div className="no-print mb-8">
                    <AnalyticsPanel
                      quizHistory={quizHistory}
                      onClearHistory={() => { setQuizHistory([]); }}
                      onClose={() => setShowAnalytics(false)}
                    />
                  </div>
                )}

                {/* Tab Bar */}
                {!isFullscreen && !showAnalytics && (
                  <div className="no-print flex gap-1 overflow-x-auto pb-4 mb-6 md:mb-8 border-b border-gray-200 dark:border-[#262626] custom-scrollbar relative w-full items-center snap-x snap-mandatory scroll-smooth">
                    <div className="absolute left-0 bottom-4 w-full h-[1px] bg-gray-200 dark:bg-[#262626]" />
                    {[
                      { id: 'formulas', icon: <Calculator size={14} />, label: 'formulas' },
                      { id: 'notes', icon: <FileText size={14} />, label: 'notes' },
                      { id: 'flashcards', icon: <Layers size={14} />, label: 'flashcards' },
                      { id: 'quiz', icon: <BrainCircuit size={14} />, label: 'quiz' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-h-[44px] px-4 md:px-5 py-2.5 font-mono text-xs md:text-sm flex items-center gap-2 capitalize transition-all duration-300 whitespace-nowrap relative z-10 snap-start touch-manipulation ${activeTab === tab.id
                            ? 'text-gray-900 dark:text-white bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] border-b-transparent rounded-t-lg shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-transparent border border-transparent hover:bg-gray-100 dark:hover:bg-[#121212]/50'
                          }`}
                      >
                        {tab.icon} {tab.label}.md
                      </button>
                    ))}
                  </div>
                )}

                {/* Files-lost-after-refresh notice */}
                {filesLostAfterRefresh && !showAnalytics && (
                  <div className="no-print mb-4 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-400 font-semibold text-xs">Session restored from cache</p>
                      <p className="text-gray-500 text-xs mt-0.5">Your study materials are intact. To use Regenerate, please re-upload your original file from the workshop.</p>
                    </div>
                  </div>
                )}

                {/* Regenerate button for non-quiz tabs */}
                {activeTab !== 'quiz' && !isFullscreen && !showAnalytics && (
                  <div className="no-print flex justify-end mb-3">
                    <button
                      onClick={() => handleRegenerateSection(activeTab === 'notes' ? 'notes' : activeTab)}
                      disabled={!!regeneratingSection || filesLostAfterRefresh || isOffline}
                      title={filesLostAfterRefresh ? 'Re-upload your file to regenerate' : isOffline ? 'Offline — cannot regenerate' : ''}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400/40 dark:hover:border-indigo-500/30 font-mono text-[11px] transition-all disabled:opacity-40 shadow-sm"
                    >
                      <RefreshCw size={11} className={regeneratingSection === activeTab ? 'animate-spin text-indigo-500' : ''} />
                      {regeneratingSection === activeTab ? 'Regenerating...' : `Regenerate ${activeTab}`}
                    </button>
                  </div>
                )}

                {!showAnalytics && activeTab === 'formulas' && <FormulasTab formulas={results.formulas} loading={regeneratingSection === 'formulas'} />}
                {!showAnalytics && activeTab === 'notes' && <NotesTab notes={results.short_notes} loading={regeneratingSection === 'notes'} />}
                {!showAnalytics && activeTab === 'flashcards' && <FlashcardsTab flashcards={results.flashcards} loading={regeneratingSection === 'flashcards'} />}
                {!showAnalytics && activeTab === 'quiz' && (
                  <QuizTab
                    files={files}
                    subject={subject}
                    isFullscreen={isFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    mainContainerRef={mainContainerRef}
                    onQuizComplete={handleQuizComplete}
                    isOffline={isOffline}
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}
      </main>
    </div>
  );
}