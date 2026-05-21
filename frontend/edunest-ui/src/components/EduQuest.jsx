/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, BookOpen, CheckSquare, Plus, Trash2, Calendar, Award, 
  ChevronLeft, ChevronRight, Highlighter, Edit3, Bookmark, 
  Play, Pause, RotateCcw, AlertCircle, Sparkles, Filter, Paintbrush, 
  Trash, Star, Clock, ZoomIn, ZoomOut, Maximize2, Minimize2,
  FileText, Search, X, ChevronsLeft, ChevronsRight, LayoutGrid, Eye
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const API_BASE = 'http://localhost:8082';

// ─── Minimap / Thumbnail Component ───────────────────────────────────────────
function PageThumbnail({ pdfDoc, pageNum, isActive, onClick, isBookmarked }) {
  const thumbRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!pdfDoc || !thumbRef.current || rendered) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;
        const vp = page.getViewport({ scale: 0.2 });
        const canvas = thumbRef.current;
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (!cancelled) setRendered(true);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum]);

  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 group ${
        isActive 
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30' 
          : 'border-gray-200 dark:border-[#262626] hover:border-indigo-400/50'
      }`}
      title={`Go to page ${pageNum}`}
    >
      <canvas ref={thumbRef} className="w-16 h-auto block bg-white" />
      <span className={`absolute bottom-0 inset-x-0 text-center py-0.5 font-mono text-[8px] font-black ${
        isActive ? 'bg-indigo-500 text-white' : 'bg-black/50 text-white/80'
      }`}>{pageNum}</span>
      {isBookmarked && (
        <span className="absolute top-0.5 right-0.5 text-amber-400 drop-shadow">
          <Bookmark size={10} fill="currentColor" />
        </span>
      )}
    </button>
  );
}

// ─── Main EduQuest Component ─────────────────────────────────────────────────
export default function EduQuest({ onBack, user }) {
  // ── PDF Core State ─────────────────────────────────────────────────────────
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfId, setPdfId] = useState('');
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // ── Zoom & View ────────────────────────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = fit-to-width
  const [readerFullscreen, setReaderFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const [isDragScrolling, setIsDragScrolling] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // ── Annotation Tools ───────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState('pan');
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushWidth, setBrushWidth] = useState(3);
  const [noteColor, setNoteColor] = useState('yellow');
  
  // ── Annotation Data (SQLite Synced) ────────────────────────────────────────
  const [highlights, setHighlights] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [drawings, setDrawings] = useState([]);

  // ── Drawing State ──────────────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [draggingNoteId, setDraggingNoteId] = useState(null);

  // ── Highlight State ────────────────────────────────────────────────────────
  const [activeHighlightStart, setActiveHighlightStart] = useState(null);
  const [activeHighlightRect, setActiveHighlightRect] = useState(null);

  // ── Focus Timer ────────────────────────────────────────────────────────────
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // ── Scheduler ──────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskCategory, setTaskCategory] = useState('Study');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [totalXP, setTotalXP] = useState(() => {
    try { return parseInt(localStorage.getItem('eduquest_xp') || '0'); } catch { return 0; }
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [schedulerFilter, setSchedulerFilter] = useState('All');
  const [schedulerPriorityFilter, setSchedulerPriorityFilter] = useState('All');
  const [schedulerCompletionFilter, setSchedulerCompletionFilter] = useState('Active');

  // ── Refs ────────────────────────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const readerPanelRef = useRef(null);

  // ══════════════════════════════════════════════════════════════════════════════
  // XP & Level
  // ══════════════════════════════════════════════════════════════════════════════
  const level = useMemo(() => Math.floor(totalXP / 100) + 1, [totalXP]);
  const currentLevelXP = useMemo(() => totalXP % 100, [totalXP]);
  const rankTitle = useMemo(() => {
    if (level >= 15) return 'Savant Sage';
    if (level >= 10) return 'Cognitive Master';
    if (level >= 6) return 'Apprentice Thinker';
    return 'Novice Scholar';
  }, [level]);

  useEffect(() => { localStorage.setItem('eduquest_xp', totalXP.toString()); }, [totalXP]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Focus Timer
  // ══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setSecondsSpent(prev => {
        const next = prev + 1;
        if (next % 30 === 0) logFocusTime(30);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    const flush = () => { const r = secondsSpent % 30; if (r > 2) logFocusTime(r); };
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('beforeunload', flush); flush(); };
  }, [secondsSpent]);

  const logFocusTime = async (seconds) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch(`${API_BASE}/api/time_spent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, durationSeconds: seconds })
      });
    } catch (e) { console.error('Focus log error:', e); }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Data Fetching
  // ══════════════════════════════════════════════════════════════════════════════
  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { if (pdfId) fetchAnnotations(); }, [pdfId]);

  const fetchTasks = async () => {
    try { const r = await fetch(`${API_BASE}/api/tasks`); if (r.ok) setTasks(await r.json()); }
    catch (e) { console.error('Task fetch error:', e); }
  };

  const fetchAnnotations = async () => {
    if (!pdfId) return;
    try {
      const [hl, bm, sn, dr] = await Promise.all([
        fetch(`${API_BASE}/api/highlights?pdfId=${pdfId}`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/bookmarks?pdfId=${pdfId}`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/sticky_notes?pdfId=${pdfId}`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/drawings?pdfId=${pdfId}`).then(r => r.ok ? r.json() : []),
      ]);
      setHighlights(hl); setBookmarks(bm); setStickyNotes(sn); setDrawings(dr);
    } catch (e) { console.error('Annotation fetch error:', e); }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PDF Loading
  // ══════════════════════════════════════════════════════════════════════════════
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true); setPdfError(''); setPdfFile(file);
    setPdfId(file.name.replace(/[^a-zA-Z0-9]/g, '_'));
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        setPdfDoc(pdf); setNumPages(pdf.numPages); setCurrentPage(1);
      } catch (err) {
        console.error('PDF parse error:', err);
        setPdfError('Failed to parse PDF. Ensure it is a valid file.');
      } finally { setPdfLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // High-DPI PDF Rendering
  // ══════════════════════════════════════════════════════════════════════════════
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    if (renderTaskRef.current) { renderTaskRef.current.cancel(); }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Dynamically calculate width using the actual scroll container area
      const scrollEl = scrollContainerRef.current;
      const scrollWidth = scrollEl ? scrollEl.clientWidth : 900;
      const containerWidth = Math.max(600, scrollWidth - 24); // fallback minimum 600px
      
      const originalViewport = page.getViewport({ scale: 1.0 });
      const baseScale = containerWidth / originalViewport.width;
      const scale = baseScale * zoomLevel;
      const viewport = page.getViewport({ scale });

      // High-DPI: render at 2x resolution for sharpness, display at CSS size
      const dpr = window.devicePixelRatio || 1;
      const outputScale = Math.min(dpr, 2); // cap at 2x for performance
      
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      renderTaskRef.current = page.render({ canvasContext: context, viewport });
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') console.error('Render error:', err);
    }
  }, [pdfDoc, zoomLevel, showThumbnails, readerFullscreen]);

  useEffect(() => { if (pdfDoc) renderPage(currentPage); }, [pdfDoc, currentPage, renderPage]);

  // Debounced resize handler
  useEffect(() => {
    let timeout;
    const handleResize = () => { clearTimeout(timeout); timeout = setTimeout(() => { if (pdfDoc) renderPage(currentPage); }, 200); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeout); };
  }, [pdfDoc, currentPage, renderPage]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Keyboard Navigation
  // ══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKey = (e) => {
      if (!pdfDoc) return;
      // Don't capture when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage(p => Math.min(numPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentPage(p => Math.max(1, p - 1));
      } else if (e.key === 'Home') {
        e.preventDefault(); setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault(); setCurrentPage(numPages);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault(); setZoomLevel(z => Math.min(3, z + 0.25));
      } else if (e.key === '-') {
        e.preventDefault(); setZoomLevel(z => Math.max(0.5, z - 0.25));
      } else if (e.key === '0') {
        e.preventDefault(); setZoomLevel(1);
      } else if (e.key === 'b') {
        toggleBookmark();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pdfDoc, numPages, currentPage]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Pan / Drag Scroll (when zoomed in)
  // ══════════════════════════════════════════════════════════════════════════════
  const handleScrollMouseDown = (e) => {
    if (activeTool !== 'pan' || zoomLevel <= 1) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragScrolling(true);
    dragStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
  };
  const handleScrollMouseMove = (e) => {
    if (!isDragScrolling) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x);
    el.scrollTop = dragStart.current.scrollTop - (e.clientY - dragStart.current.y);
  };
  const handleScrollMouseUp = () => setIsDragScrolling(false);

  // ══════════════════════════════════════════════════════════════════════════════
  // Page Jump
  // ══════════════════════════════════════════════════════════════════════════════
  const handlePageJump = (e) => {
    e.preventDefault();
    const p = parseInt(pageInputValue);
    if (p >= 1 && p <= numPages) { setCurrentPage(p); setPageInputValue(''); }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Coordinate Helper
  // ══════════════════════════════════════════════════════════════════════════════
  const getRelativeCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Sticky Notes
  // ══════════════════════════════════════════════════════════════════════════════
  const handlePageClick = async (e) => {
    if (activeTool !== 'note' || !pdfId) return;
    const coords = getRelativeCoords(e);
    const id = `note_${Date.now()}`;
    const newNote = { id, pdfId, pageIndex: currentPage, x: coords.x, y: coords.y, color: noteColor, content: 'Type note...' };
    setStickyNotes(prev => [...prev, newNote]);
    try {
      await fetch(`${API_BASE}/api/sticky_notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNote)
      });
    } catch (err) { console.error('Note create error:', err); }
  };

  const updateNoteContent = async (id, text) => {
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, content: text } : n));
    try {
      await fetch(`${API_BASE}/api/sticky_notes/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text })
      });
    } catch (e) { console.error('Note update error:', e); }
  };

  const handleNoteDragEnd = async (id, info) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const note = stickyNotes.find(n => n.id === id);
    if (!note) return;
    const currentXPx = (note.x / 100) * canvasRect.width;
    const currentYPx = (note.y / 100) * canvasRect.height;
    const x = Math.max(0, Math.min(95, ((currentXPx + info.offset.x) / canvasRect.width) * 100));
    const y = Math.max(0, Math.min(95, ((currentYPx + info.offset.y) / canvasRect.height) * 100));
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
    try {
      await fetch(`${API_BASE}/api/sticky_notes/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x, y })
      });
    } catch (e) { console.error('Note drag sync error:', e); }
  };

  const deleteStickyNote = async (id) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
    try { await fetch(`${API_BASE}/api/sticky_notes/${id}`, { method: 'DELETE' }); } catch (e) {}
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Freehand Drawing
  // ══════════════════════════════════════════════════════════════════════════════
  const handlePointerDown = (e) => {
    if (activeTool !== 'draw' || !pdfId) return;
    setIsDrawing(true);
    const c = getRelativeCoords(e);
    setCurrentPath(`M ${c.x.toFixed(1)} ${c.y.toFixed(1)}`);
  };
  const handlePointerMove = (e) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const c = getRelativeCoords(e);
    setCurrentPath(prev => `${prev} L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`);
  };
  const handlePointerUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (!currentPath || currentPath.trim().split(' ').length < 4) { setCurrentPath(''); return; }
    const id = `draw_${Date.now()}`;
    const newDrawing = { id, pdfId, pageIndex: currentPage, pathData: currentPath, color: brushColor, strokeWidth: brushWidth };
    setDrawings(prev => [...prev, newDrawing]);
    setCurrentPath('');
    try {
      await fetch(`${API_BASE}/api/drawings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDrawing)
      });
    } catch (e) { console.error('Drawing save error:', e); }
  };

  const clearDrawings = async () => {
    if (!pdfId) return;
    setDrawings(prev => prev.filter(d => d.pageIndex !== currentPage));
    try { await fetch(`${API_BASE}/api/drawings/clear?pdfId=${pdfId}&pageIndex=${currentPage}`, { method: 'DELETE' }); } catch (e) {}
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Highlights
  // ══════════════════════════════════════════════════════════════════════════════
  const handleHighlightDown = (e) => {
    if (activeTool !== 'highlight' || !pdfId) return;
    const c = getRelativeCoords(e);
    setActiveHighlightStart(c);
    setActiveHighlightRect({ left: c.x, top: c.y, width: 0, height: 0 });
  };
  const handleHighlightMove = (e) => {
    if (!activeHighlightStart) return;
    const c = getRelativeCoords(e);
    setActiveHighlightRect({
      left: Math.min(activeHighlightStart.x, c.x), top: Math.min(activeHighlightStart.y, c.y),
      width: Math.abs(activeHighlightStart.x - c.x), height: Math.abs(activeHighlightStart.y - c.y)
    });
  };
  const handleHighlightUp = async () => {
    if (!activeHighlightRect || activeHighlightRect.width < 1 || activeHighlightRect.height < 1) {
      setActiveHighlightStart(null); setActiveHighlightRect(null); return;
    }
    const id = `hl_${Date.now()}`;
    const newHL = { id, pdfId, pageIndex: currentPage, rects: [activeHighlightRect], color: brushColor };
    setHighlights(prev => [...prev, newHL]);
    setActiveHighlightStart(null); setActiveHighlightRect(null);
    try {
      await fetch(`${API_BASE}/api/highlights`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newHL)
      });
    } catch (e) { console.error('Highlight save error:', e); }
  };
  const deleteHighlight = async (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    try { await fetch(`${API_BASE}/api/highlights/${id}`, { method: 'DELETE' }); } catch (e) {}
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Bookmarks
  // ══════════════════════════════════════════════════════════════════════════════
  const toggleBookmark = async () => {
    if (!pdfId) return;
    const existing = bookmarks.find(b => b.pageIndex === currentPage);
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      try { await fetch(`${API_BASE}/api/bookmarks/${existing.id}`, { method: 'DELETE' }); } catch (e) {}
    } else {
      const id = `bm_${Date.now()}`;
      const bm = { id, pdfId, pageIndex: currentPage };
      setBookmarks(prev => [...prev, bm]);
      try {
        await fetch(`${API_BASE}/api/bookmarks`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bm)
        });
      } catch (e) {}
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Scheduler
  // ══════════════════════════════════════════════════════════════════════════════
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const id = `task_${Date.now()}`;
    const newTask = { id, title: taskTitle.trim(), time: taskTime || 'No time set', category: taskCategory, priority: taskPriority, completed: 0 };
    setTasks(prev => [...prev, newTask]);
    setTaskTitle(''); setTaskTime('');
    try {
      await fetch(`${API_BASE}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) });
    } catch (err) { console.error('Task create error:', err); }
  };

  const handleToggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nextCompleted = task.completed ? 0 : 1;
    if (nextCompleted === 1) {
      let xpAward = task.priority === 'High' ? 80 : task.priority === 'Low' ? 30 : 50;
      const nextXP = totalXP + xpAward;
      setTotalXP(nextXP);
      const curLvl = Math.floor(totalXP / 100) + 1;
      const nxtLvl = Math.floor(nextXP / 100) + 1;
      if (nxtLvl > curLvl) {
        setTimeout(() => {
          setShowLevelUp(true);
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6'] });
        }, 300);
      } else {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#6ee7b7'] });
      }
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: nextCompleted } : t));
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: nextCompleted })
      });
    } catch (e) { console.error('Task toggle error:', e); }
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' }); } catch (e) {}
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchCat = schedulerFilter === 'All' || t.category === schedulerFilter;
      const matchPrio = schedulerPriorityFilter === 'All' || t.priority === schedulerPriorityFilter;
      const matchComp = schedulerCompletionFilter === 'All' || (schedulerCompletionFilter === 'Active' && !t.completed) || (schedulerCompletionFilter === 'Completed' && t.completed);
      return matchCat && matchPrio && matchComp;
    });
  }, [tasks, schedulerFilter, schedulerPriorityFilter, schedulerCompletionFilter]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Utilities
  // ══════════════════════════════════════════════════════════════════════════════
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const zoomPercent = `${Math.round(zoomLevel * 100)}%`;
  const isBookmarked = bookmarks.some(b => b.pageIndex === currentPage);
  const pageAnnotations = useMemo(() => ({
    highlights: highlights.filter(h => h.pageIndex === currentPage),
    drawings: drawings.filter(d => d.pageIndex === currentPage),
    notes: stickyNotes.filter(n => n.pageIndex === currentPage),
  }), [highlights, drawings, stickyNotes, currentPage]);

  // Dynamic tall height for the viewer to make reading books very comfortable
  const readerHeightStyle = useMemo(() => ({
    height: readerFullscreen ? 'calc(100vh - 160px)' : '780px',
    maxHeight: readerFullscreen ? '88vh' : '82vh',
  }), [readerFullscreen]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`w-full mx-auto px-4 md:px-8 py-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 ${readerFullscreen ? 'max-w-full' : 'max-w-[1600px]'}`}>
      
      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            EduQuest Study Hub <Sparkles className="text-rose-500 animate-pulse w-6 h-6" />
          </h1>
          <p className="mt-1.5 text-gray-500 font-mono text-[11px]">
            Interactive PDF Reader with annotations • Gamified Study Scheduler
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pdfDoc && (
            <button 
              onClick={() => setReaderFullscreen(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 font-mono text-[11px] hover:border-indigo-500/40 transition-all"
            >
              {readerFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              {readerFullscreen ? 'Exit Focus' : 'Focus Mode'}
            </button>
          )}
          <button onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 font-bold font-mono text-xs hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-all active:scale-95"
          >← Dashboard</button>
        </div>
      </div>

      <div className={`grid items-start gap-6 ${readerFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        
        {/* ════════════════════════════════════════════════════════════════════════
            LEFT: INTERACTIVE PDF READER
            ════════════════════════════════════════════════════════════════════════ */}
        <div className={readerFullscreen ? '' : 'lg:col-span-9'} ref={readerPanelRef}>
          <div className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl shadow-gray-200/20 dark:shadow-black/20 flex flex-col">
            
            {/* ── TOP TOOLBAR ──────────────────────────────────────────────────── */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between gap-2 bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-[#0a0a0a] dark:to-[#0d0d0d] flex-wrap">
              {/* Left: Upload + filename */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold font-mono text-[11px] cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-500/20">
                  <Upload size={12} /> Upload PDF
                  <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
                {pdfFile && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-[#252525]">
                    <FileText size={11} className="text-indigo-400 shrink-0" />
                    <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{pdfFile.name}</span>
                    <span className="font-mono text-[9px] text-gray-400 dark:text-gray-600 border-l border-gray-200 dark:border-[#333] pl-1.5">{numPages}p</span>
                  </div>
                )}
              </div>

              {/* Right: Navigation + Zoom + Actions */}
              {pdfDoc && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Page Navigation */}
                  <div className="flex items-center bg-gray-100 dark:bg-[#151515] rounded-lg border border-gray-200 dark:border-[#262626] overflow-hidden">
                    <button disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1e1e1e] text-gray-500 disabled:opacity-30 transition-colors" title="First page">
                      <ChevronsLeft size={12} />
                    </button>
                    <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1e1e1e] text-gray-500 disabled:opacity-30 transition-colors" title="Previous page">
                      <ChevronLeft size={12} />
                    </button>
                    <form onSubmit={handlePageJump} className="flex items-center px-1 gap-1">
                      <input
                        type="text" inputMode="numeric"
                        value={pageInputValue} onChange={e => setPageInputValue(e.target.value)}
                        placeholder={String(currentPage)}
                        className="w-7 text-center font-mono text-[11px] bg-transparent text-gray-900 dark:text-white outline-none placeholder:text-gray-500"
                      />
                      <span className="text-gray-400 font-mono text-[10px]">/ {numPages}</span>
                    </form>
                    <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1e1e1e] text-gray-500 disabled:opacity-30 transition-colors" title="Next page">
                      <ChevronRight size={12} />
                    </button>
                    <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(numPages)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1e1e1e] text-gray-500 disabled:opacity-30 transition-colors" title="Last page">
                      <ChevronsRight size={12} />
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center bg-gray-100 dark:bg-[#151515] rounded-lg border border-gray-200 dark:border-[#262626] overflow-hidden">
                    <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1e1e1e] text-gray-500 transition-colors" title="Zoom out (-)"><ZoomOut size={12} /></button>
                    <button onClick={() => setZoomLevel(1)}
                      className="px-2 py-1 font-mono text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors min-w-[40px] text-center" title="Reset zoom (0)">
                      {zoomPercent}
                    </button>
                    <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1e1e1e] text-gray-500 transition-colors" title="Zoom in (+)"><ZoomIn size={12} /></button>
                  </div>

                  {/* Bookmark Toggle */}
                  <button onClick={toggleBookmark}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isBookmarked ? 'border-amber-400/40 bg-amber-400/10 text-amber-500' : 'border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400'
                    }`} title="Bookmark page (B)">
                    <Bookmark size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
                  </button>

                  {/* Thumbnail Toggle */}
                  <button onClick={() => setShowThumbnails(p => !p)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      showThumbnails ? 'border-indigo-400/40 bg-indigo-400/10 text-indigo-500' : 'border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400'
                    }`} title="Page thumbnails">
                    <LayoutGrid size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* ── ANNOTATION TOOLBAR ───────────────────────────────────────────── */}
            {pdfDoc && (
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-[#141414] bg-white dark:bg-[#0b0b0b] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { id: 'pan', label: 'Select', icon: Eye, tip: 'Pan & select' },
                    { id: 'highlight', label: 'Highlight', icon: Highlighter, tip: 'Drag to highlight' },
                    { id: 'draw', label: 'Draw', icon: Paintbrush, tip: 'Freehand sketch' },
                    { id: 'note', label: 'Note', icon: Edit3, tip: 'Click to add sticky note' },
                  ].map(tool => {
                    const Icon = tool.icon;
                    return (
                      <button key={tool.id} onClick={() => setActiveTool(tool.id)} title={tool.tip}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold border transition-all ${
                          activeTool === tool.id
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#151515]'
                        }`}>
                        <Icon size={11} /> {tool.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {(activeTool === 'draw' || activeTool === 'highlight') && (
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#121212] px-2 py-0.5 rounded-md border border-gray-200 dark:border-[#262626]">
                      {['#ef4444', '#10b981', '#a855f7', '#3b82f6', '#eab308'].map(color => (
                        <button key={color} onClick={() => setBrushColor(color)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${brushColor === color ? 'ring-2 ring-indigo-500 scale-125' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  )}
                  {activeTool === 'note' && (
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#121212] px-2 py-0.5 rounded-md border border-gray-200 dark:border-[#262626]">
                      {[{ n:'yellow', h:'#fef08a' }, { n:'green', h:'#bbf7d0' }, { n:'orange', h:'#fed7aa' }, { n:'red', h:'#fecaca' }].map(c => (
                        <button key={c.n} onClick={() => setNoteColor(c.n)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${noteColor === c.n ? 'ring-2 ring-indigo-500 scale-125' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: c.h }} title={c.n} />
                      ))}
                    </div>
                  )}
                  {activeTool === 'draw' && (
                    <>
                      <input type="range" min="1" max="10" value={brushWidth} onChange={e => setBrushWidth(parseInt(e.target.value))}
                        className="w-14 accent-indigo-500" title={`Stroke: ${brushWidth}px`} />
                      <button onClick={clearDrawings}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 hover:bg-red-500/10 hover:text-red-500 text-gray-500 font-mono text-[9px] border border-gray-200 dark:border-[#262626] transition-all"
                        title="Clear page sketches"><Trash size={9} /> Clear</button>
                    </>
                  )}
                  
                  {/* Annotation count badge */}
                  <span className="font-mono text-[9px] text-gray-400 dark:text-gray-600 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#222]">
                    {pageAnnotations.highlights.length + pageAnnotations.drawings.length + pageAnnotations.notes.length} on pg
                  </span>
                </div>
              </div>
            )}

            {/* ── MAIN CANVAS AREA ─────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-[520px]">
              
              {/* Thumbnail Sidebar */}
              <AnimatePresence>
                {showThumbnails && pdfDoc && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }} animate={{ width: 88, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    className="border-r border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#090909] overflow-y-auto overflow-x-hidden flex flex-col gap-2 p-2 shrink-0"
                    style={readerHeightStyle}
                  >
                    {Array.from({ length: numPages }, (_, i) => i + 1).map(pg => (
                      <PageThumbnail
                        key={pg} pdfDoc={pdfDoc} pageNum={pg}
                        isActive={pg === currentPage}
                        onClick={() => setCurrentPage(pg)}
                        isBookmarked={bookmarks.some(b => b.pageIndex === pg)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Canvas / PDF Viewport */}
              <div 
                ref={scrollContainerRef}
                className={`flex-1 overflow-auto bg-gradient-to-b from-gray-100 to-gray-50 dark:from-[#080808] dark:to-[#0a0a0a] relative ${
                  activeTool === 'pan' && zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
                style={readerHeightStyle}
                onMouseDown={handleScrollMouseDown}
                onMouseMove={handleScrollMouseMove}
                onMouseUp={handleScrollMouseUp}
                onMouseLeave={handleScrollMouseUp}
              >
                {pdfLoading && (
                  <div className="absolute inset-0 z-40 bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <span className="font-mono text-[11px] text-gray-500">Parsing PDF...</span>
                  </div>
                )}

                {pdfError && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center p-8">
                    <div className="p-6 text-center max-w-sm bg-white dark:bg-[#121212] border border-red-500/20 rounded-2xl shadow-xl">
                      <AlertCircle className="text-red-500 mx-auto mb-3" size={28} />
                      <p className="font-mono text-xs text-red-500">{pdfError}</p>
                    </div>
                  </div>
                )}

                {!pdfFile && !pdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="p-10 text-center max-w-md border-2 border-dashed border-gray-300 dark:border-[#262626] rounded-3xl bg-white dark:bg-[#0d0d0d]">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/10 dark:to-violet-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                        <BookOpen className="text-indigo-500 w-8 h-8" />
                      </div>
                      <h3 className="text-gray-900 dark:text-white font-bold text-base mb-1">Upload a Study Document</h3>
                      <p className="text-gray-500 text-xs mb-5 leading-relaxed">
                        Open your textbook PDFs, lecture slides, or study guides to highlight, sketch, and place study notes.
                      </p>
                      <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold font-mono text-xs cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                        <Upload size={13} /> Select PDF File
                        <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                      </label>
                      <p className="mt-4 font-mono text-[9px] text-gray-400 dark:text-gray-600">
                        Keyboard: ←→ navigate • +/- zoom • B bookmark • 0 reset zoom
                      </p>
                    </div>
                  </div>
                )}

                {/* PDF Canvas + Overlay layers */}
                <div 
                  ref={containerRef} 
                  className="relative mx-auto my-4"
                  style={{ display: pdfDoc ? 'block' : 'none', width: 'fit-content' }}
                >
                  {/* 3D Page Transition */}
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, rotateY: 12, scale: 0.98 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ transformOrigin: 'left center', perspective: '1200px' }}
                  >
                    <canvas ref={canvasRef} className="block shadow-2xl rounded-sm" />
                  </motion.div>

                  {/* SVG Drawing Layer */}
                  <svg
                    className={`absolute inset-0 w-full h-full z-20 ${activeTool === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                    viewBox="0 0 100 100" preserveAspectRatio="none"
                    onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
                  >
                    {pageAnnotations.drawings.map(d => (
                      <path key={d.id} d={d.pathData} fill="none" stroke={d.color} strokeWidth={d.strokeWidth * 0.3} strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                    {currentPath && (
                      <path d={currentPath} fill="none" stroke={brushColor} strokeWidth={brushWidth * 0.3} strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>

                  {/* Highlight Layer */}
                  <div
                    className={`absolute inset-0 w-full h-full z-20 ${activeTool === 'highlight' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                    onMouseDown={handleHighlightDown} onMouseMove={handleHighlightMove} onMouseUp={handleHighlightUp}
                  >
                    {pageAnnotations.highlights.map(hl => (
                      hl.rects.map((rect, rI) => (
                        <div key={`${hl.id}_${rI}`} className="absolute pointer-events-auto group"
                          style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%`, backgroundColor: `${hl.color}35`, mixBlendMode: 'multiply', borderRadius: '2px' }}>
                          <button onClick={() => deleteHighlight(hl.id)}
                            className="absolute -top-2.5 -right-2.5 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all shadow z-30">
                            <X size={8} />
                          </button>
                        </div>
                      ))
                    ))}
                    {activeHighlightRect && (
                      <div className="absolute pointer-events-none border border-dashed border-indigo-400"
                        style={{ left: `${activeHighlightRect.left}%`, top: `${activeHighlightRect.top}%`, width: `${activeHighlightRect.width}%`, height: `${activeHighlightRect.height}%`, backgroundColor: `${brushColor}25` }} />
                    )}
                  </div>

                  {/* Sticky Notes Layer */}
                  <div onClick={handlePageClick}
                    className={`absolute inset-0 w-full h-full z-20 ${activeTool === 'note' ? 'cursor-cell pointer-events-auto' : 'pointer-events-none'}`}>
                    {pageAnnotations.notes.map(note => {
                      const cc = { yellow:'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300/80 text-yellow-900 dark:text-yellow-200', green:'bg-green-50 dark:bg-green-900/30 border-green-300/80 text-green-900 dark:text-green-200', orange:'bg-orange-50 dark:bg-orange-900/30 border-orange-300/80 text-orange-900 dark:text-orange-200', red:'bg-red-50 dark:bg-red-900/30 border-red-300/80 text-red-900 dark:text-red-200' }[note.color] || 'bg-yellow-50 border-yellow-300 text-yellow-900';
                      return (
                        <motion.div key={note.id} drag dragMomentum={false}
                          onDragStart={() => setDraggingNoteId(note.id)}
                          onDragEnd={(e, info) => { handleNoteDragEnd(note.id, info); setTimeout(() => setDraggingNoteId(null), 100); }}
                          className={`absolute p-2 rounded-lg border shadow-lg max-w-[150px] pointer-events-auto select-none group cursor-grab active:cursor-grabbing ${cc} z-30 backdrop-blur-sm`}
                          style={{ left: `${note.x}%`, top: `${note.y}%` }}>
                          <textarea value={note.content} onChange={e => updateNoteContent(note.id, e.target.value)}
                            disabled={draggingNoteId === note.id}
                            className="bg-transparent border-none text-[9px] leading-tight focus:outline-none resize-none w-full h-10 font-mono outline-none font-bold" />
                          <button onClick={() => deleteStickyNote(note.id)}
                            className="absolute -top-2 -right-2 p-0.5 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow" title="Delete"><Trash2 size={7} /></button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── BOTTOM STATUS BAR ────────────────────────────────────────────── */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-[#1a1a1a] bg-gray-50/80 dark:bg-[#090909] flex items-center justify-between gap-3 flex-wrap font-mono text-[10px] text-gray-500">
              {/* Focus Timer */}
              <div className="flex items-center gap-2">
                <Clock size={11} className="text-rose-500" />
                <span className="text-gray-700 dark:text-gray-300 font-bold">Focus:</span>
                <span className="font-black text-xs text-gray-900 dark:text-white px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-[#252525] tabular-nums">{formatTime(secondsSpent)}</span>
                <button onClick={() => setTimerActive(p => !p)} className="p-1 rounded bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all">
                  {timerActive ? <Pause size={8} /> : <Play size={8} />}
                </button>
                <button onClick={() => setSecondsSpent(0)} className="p-1 rounded bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all" title="Reset">
                  <RotateCcw size={8} />
                </button>
              </div>

              {/* Bookmark Quick-Jump Chips */}
              {pdfDoc && bookmarks.length > 0 && (
                <div className="flex items-center gap-1">
                  <Bookmark size={9} className="text-amber-500" />
                  <div className="flex gap-0.5 overflow-x-auto max-w-[180px]">
                    {bookmarks.sort((a,b) => a.pageIndex - b.pageIndex).map(bm => (
                      <button key={bm.id} onClick={() => setCurrentPage(bm.pageIndex)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                          bm.pageIndex === currentPage 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                        }`}>P{bm.pageIndex}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Zoom indicator */}
              {pdfDoc && <span className="text-gray-400 dark:text-gray-600">Zoom: {zoomPercent}</span>}
            </div>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            RIGHT: GAMIFIED STUDY SCHEDULER
            ════════════════════════════════════════════════════════════════════════ */}
        {!readerFullscreen && (
          <div className="lg:col-span-3 space-y-5">
            
            {/* XP / Level Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 border border-indigo-500/20 rounded-2xl p-5 text-white shadow-xl shadow-indigo-950/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/25 flex items-center justify-center">
                    <Award className="text-indigo-300" size={18} />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-indigo-300 uppercase tracking-widest block font-bold">Study Quest</span>
                    <h3 className="font-black text-sm leading-tight">Level {level}</h3>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-indigo-400/10 border border-indigo-400/20 text-indigo-300 text-[9px] font-mono uppercase tracking-wider font-bold">{rankTitle}</div>
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-[9px] font-mono text-indigo-300">
                  <span>XP: {currentLevelXP}/100</span>
                  <span>{100 - currentLevelXP} to next</span>
                </div>
                <div className="w-full h-2 bg-indigo-950/80 rounded-full overflow-hidden border border-indigo-500/10">
                  <motion.div className="h-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400"
                    initial={{ width: 0 }} animate={{ width: `${currentLevelXP}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                </div>
              </div>
            </div>

            {/* Task Planner */}
            <div className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl shadow-lg p-4 space-y-4">
              <form onSubmit={handleAddTask} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold">New Quest</span>
                  <span className="text-[9px] text-gray-400 font-mono">SQLite sync</span>
                </div>
                <input type="text" placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#070707] text-[10px] focus:outline-none dark:text-gray-300">
                    {['Study', 'Revision', 'Homework', 'Exam', 'Research'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#070707] text-[10px] focus:outline-none dark:text-gray-300">
                    {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#070707] text-[10px] focus:outline-none dark:text-gray-300" />
                  <button type="submit"
                    className="px-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-md shadow-indigo-500/10 shrink-0">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </form>

              <hr className="border-gray-100 dark:border-[#191919]" />

              {/* Filters */}
              <div className="space-y-2 font-mono text-[9px]">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1"><Filter size={9} /> Filters</span>
                  <button onClick={() => { setSchedulerFilter('All'); setSchedulerPriorityFilter('All'); setSchedulerCompletionFilter('Active'); }}
                    className="hover:text-indigo-500 transition-colors">Clear</button>
                </div>
                <div className="grid grid-cols-3 gap-0.5 bg-gray-100 dark:bg-[#121212] p-0.5 rounded-md border border-gray-200/50 dark:border-[#202020]">
                  {['All', 'Active', 'Completed'].map(s => (
                    <button key={s} type="button" onClick={() => setSchedulerCompletionFilter(s)}
                      className={`py-0.5 rounded text-center font-bold transition-all ${schedulerCompletionFilter === s ? 'bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>{s}</button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <select value={schedulerFilter} onChange={e => setSchedulerFilter(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded px-1 py-0.5 text-gray-600 dark:text-gray-400 outline-none">
                    <option value="All">All Cat.</option>
                    {['Study', 'Revision', 'Homework', 'Exam', 'Research'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={schedulerPriorityFilter} onChange={e => setSchedulerPriorityFilter(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded px-1 py-0.5 text-gray-600 dark:text-gray-400 outline-none">
                    <option value="All">All Prio.</option>
                    {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                <AnimatePresence initial={false}>
                  {filteredTasks.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-gray-200 dark:border-[#1e1e1e] rounded-xl bg-gray-50/50 dark:bg-[#070707]">
                      <CheckSquare className="text-gray-400 dark:text-gray-600 mx-auto mb-2 w-5 h-5" />
                      <p className="font-mono text-[9px] text-gray-500">No quests match filters</p>
                    </div>
                  ) : filteredTasks.map(task => {
                    const pc = { High:'bg-red-500/10 border-red-500/25 text-red-500', Medium:'bg-indigo-500/10 border-indigo-500/25 text-indigo-500', Low:'bg-green-500/10 border-green-500/25 text-green-500' }[task.priority] || '';
                    return (
                      <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${task.completed ? 'bg-gray-50/50 dark:bg-[#070707]/30 border-gray-100 dark:border-[#171717] opacity-55' : 'bg-white dark:bg-[#0e0e0e] border-gray-200 dark:border-[#1e1e1e] hover:border-indigo-500/20'}`}>
                        <button type="button" onClick={() => handleToggleTask(task.id)}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-[#3c3c3c] hover:border-indigo-500'}`}>
                          {task.completed && <span className="text-[8px] font-black leading-none">✓</span>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[11px] font-bold truncate ${task.completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>{task.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-[8px] text-gray-400 flex-wrap">
                            <span className="px-1 py-px rounded bg-gray-100 dark:bg-[#1a1a1a]">🏷️{task.category}</span>
                            <span className={`px-1 py-px rounded border ${pc}`}>⚡{task.priority}</span>
                            {task.time !== 'No time set' && <span className="flex items-center gap-0.5"><Calendar size={7} />{task.time}</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 text-gray-400 transition-colors shrink-0"><Trash2 size={10} /></button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LEVEL UP MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              className="bg-gradient-to-br from-indigo-900 via-[#131238] to-[#250b3d] border border-indigo-400/40 rounded-3xl p-8 max-w-sm w-full text-center text-white shadow-2xl relative">
              <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                <Star size={28} className="text-yellow-400 fill-yellow-400 animate-bounce" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-300 font-bold block mb-1">Level Up!</span>
              <h2 className="text-2xl font-black tracking-tight mb-1">Level {level}</h2>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-400/10 border border-indigo-400/25 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-5">{rankTitle}</span>
              <p className="text-gray-300 text-xs leading-relaxed mb-5">Keep completing study quests to unlock higher ranks!</p>
              <button onClick={() => setShowLevelUp(false)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] text-white font-bold font-mono text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
