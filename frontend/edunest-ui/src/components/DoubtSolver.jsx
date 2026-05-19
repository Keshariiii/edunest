import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BrainCircuit, Send, Trash2, FileText, Loader2,
  ChevronLeft, Sparkles, ArrowRight, MessageSquare,
  AlertTriangle, CheckCircle2, File, Paperclip, Upload, X, Image
} from 'lucide-react';
import MathText from './MathText';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DoubtSolver({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('edunest_chatbot_session_id');
    if (existing) return existing;
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('edunest_chatbot_session_id', newId);
    return newId;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  // Check if documents are already indexed
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const resp = await fetch(`${apiBase}/api/doubt-solver/status?session_id=${sessionId}`);
        if (resp.ok) {
          const data = await resp.json();
          setHasDocuments(data.has_documents);
          if (data.has_documents) {
            setUploadedFiles(data.sources.map(s => ({ name: s, status: 'indexed' })));
          }
        }
      } catch (e) {
        console.error('Status check failed:', e);
      }
    };
    checkStatus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── File Upload Handler ────────────────────────────────────────────────
  const handleFileUpload = async (filesToUpload) => {
    if (!filesToUpload?.length) return;
    setIsUploading(true);

    const formData = new FormData();
    const fileNames = [];
    for (const file of filesToUpload) {
      formData.append('files', file);
      fileNames.push(file.name);
    }

    setUploadedFiles(prev => [
      ...prev,
      ...fileNames.map(n => ({ name: n, status: 'uploading' }))
    ]);

    try {
      const resp = await fetch(`${apiBase}/api/doubt-solver/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await resp.json();
      setHasDocuments(true);
      setUploadedFiles(prev =>
        prev.map(f =>
          fileNames.includes(f.name) ? { ...f, status: 'indexed' } : f
        )
      );

      setMessages(prev => [...prev, {
        role: 'system',
        content: `📚 ${data.files.length} file(s) uploaded and indexed (${data.chunks_indexed} chunks). You can now ask questions about your study materials!`,
        timestamp: new Date()
      }]);
    } catch (e) {
      console.error('Upload error:', e);
      setUploadedFiles(prev =>
        prev.map(f =>
          fileNames.includes(f.name) ? { ...f, status: 'error' } : f
        )
      );
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Upload failed: ${e.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Chat Send Handler ──────────────────────────────────────────────────
  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const resp = await fetch(`${apiBase}/api/doubt-solver/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Chat request failed');
      }

      const data = await resp.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      }]);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Failed to get response: ${e.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Clear All ──────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!confirm('Clear all uploaded documents and chat history?')) return;
    try {
      await fetch(`${apiBase}/api/doubt-solver/clear?session_id=${sessionId}`, { method: 'DELETE' });
      setMessages([]);
      setUploadedFiles([]);
      setHasDocuments(false);
      // Remove persisted session so next mount creates a fresh one
      sessionStorage.removeItem('edunest_chatbot_session_id');
    } catch (e) {
      console.error('Clear error:', e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Drag & Drop on chat area ───────────────────────────────────────────
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) { setIsDragging(false); dragCounter.current = 0; }
  }, []);

  const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  }, []);

  const removeFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const suggestedQuestions = [
    "Explain the main concepts from my notes",
    "What are the key formulas I should remember?",
    "Can you create a summary of the material?",
    "Help me solve a problem step by step",
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4 h-[calc(100vh-80px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              AI Chatbot
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {hasDocuments ? 'Ask questions about your study materials' : 'Chat or attach study materials to get started'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(messages.length > 0 || hasDocuments) && (
            <button onClick={handleClearAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-500/30 text-xs font-medium transition-all">
              <Trash2 size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat Area — with drag-and-drop zone */}
      <div
        className="flex-1 min-h-0 flex flex-col rounded-2xl border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0d0d0d] overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-md border-2 border-dashed border-emerald-400 rounded-2xl transition-all duration-200">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Upload className="w-9 h-9 text-emerald-500 animate-bounce" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Drop files here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PDF, images, handwritten notes, DOCX, TXT</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-9 h-9 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {hasDocuments ? 'Ask me anything!' : 'Your AI Study Companion'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                {hasDocuments
                  ? "I've indexed your study materials. Ask me questions and I'll find answers from your documents."
                  : "Ask any question or attach study materials — PDFs, images of handwritten notes, screenshots — using the 📎 button below."}
              </p>

              {/* Suggested Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] hover:border-emerald-300 dark:hover:border-emerald-500/30 text-left text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                  >
                    <ArrowRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                    <span className="line-clamp-1">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-emerald-600/10'
                  : msg.role === 'error'
                    ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl rounded-bl-md px-4 py-3'
                    : msg.role === 'system'
                      ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-2xl px-4 py-3 text-sm mx-auto text-center'
                      : 'bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-md px-4 py-3'
                }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-200 dark:border-[#262626]">
                    <BrainCircuit size={14} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">EduNest AI</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed break-words">
                  <MathText content={msg.content} />
                </div>
                {msg.sources?.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-[#262626]">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-1">Sources</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((s, j) => (
                        <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          <FileText size={8} /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BrainCircuit size={14} className="text-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Thinking...</span>
                </div>
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Bottom Input Area ──────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-200 dark:border-[#1e1e1e] bg-gray-50 dark:bg-[#0a0a0a] p-3 sm:p-4">

          {/* File Pills — horizontal scrollable tray */}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
              {uploadedFiles.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                    f.status === 'indexed'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : f.status === 'uploading'
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  {f.status === 'uploading' ? <Loader2 size={12} className="animate-spin" /> : f.status === 'indexed' ? <CheckCircle2 size={12} /> : f.status === 'error' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  {f.status !== 'uploading' && (
                    <button onClick={() => removeFile(f.name)} className="ml-0.5 hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* Paperclip Attach Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff"
              className="hidden"
              onChange={(e) => { handleFileUpload(Array.from(e.target.files)); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach files (PDF, images, handwritten notes, etc.)"
              className="shrink-0 w-11 h-11 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/30 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <Paperclip size={18} />}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasDocuments ? "Ask about your study materials..." : "Ask anything or attach notes/images with 📎..."}
                disabled={isLoading}
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-500/40 transition-all disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-[#1e1e1e] text-white disabled:text-gray-500 flex items-center justify-center transition-all shadow-lg shadow-emerald-600/20 disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2">
            EduNest AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
