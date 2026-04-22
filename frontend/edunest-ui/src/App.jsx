/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Calculator, FileText, Layers, Minimize, BrainCircuit, AlertTriangle } from 'lucide-react';
// import generatePDF from 'react-to-pdf';

import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import FormulasTab from './components/FormulasTab';
import NotesTab from './components/NotesTab';
import FlashcardsTab from './components/FlashcardsTab';
import QuizTab from './components/QuizTab';

// Error Boundary — catches any rendering crash (e.g. malformed LaTeX from AI)
// and shows a friendly message instead of a completely black/blank screen.
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
        <div className="mt-10 p-8 bg-[#121212] border border-red-500/30 rounded-xl max-w-2xl mx-auto text-left">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-400 shrink-0" size={22} />
            <h3 className="text-red-400 font-bold font-mono text-sm uppercase tracking-widest">Render Error — Results could not be displayed</h3>
          </div>
          <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap bg-[#0a0a0a] p-4 rounded-md border border-[#262626] mb-6">
            {this.state.error?.message || 'Unknown rendering error'}
          </pre>
          <p className="text-gray-500 text-xs font-mono mb-6">This is usually caused by a malformed formula or special character in the AI output. Try uploading a clearer image/PDF or a different page.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2 bg-white text-black rounded-md font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [subject, setSubject] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('formulas');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const mainContainerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const pdfTargetRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);




  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => console.log("Fullscreen API error:", err));
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log("Exit Fullscreen API error:", err));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerateBase = async () => {
    if (!subject || files.length === 0) return alert("Select subject and upload at least one file!");
    setLoading(true);
    setUploadError(null);

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("subject", subject);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/generate-study-material`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Status: ${response.status}\nMessage: ${errorText}`);
      }
      const data = await response.json();

      if (data.error) {
        setUploadError(data.details);
        return;
      }

      setResults(data);
      setActiveTab('formulas');
    } catch (error) {
      console.error("Backend Error:", error);
      console.log('Backend Detail:', error);
      if (error.name === 'AbortError') {
        setUploadError("Request timed out after 60 seconds. Google's servers might be overloaded right now.");
      } else if (error.message === 'Failed to fetch') {
        setUploadError("BACKEND OFFLINE: Please ensure the FastAPI server is running on port 8000");
      } else if (error.message && error.message.includes('429')) {
        setUploadError('API BUSY: Gemini free tier limit reached. Please wait 60 seconds and try again.');
      } else if (error.message && error.message.includes('500')) {
        try {
          const jsonStr = error.message.split('Message: ')[1];
          const parsed = JSON.parse(jsonStr);
          setUploadError(parsed.detail || parsed.details || error.message);
        } catch (e) {
          setUploadError(error.message);
        }
      } else {
        setUploadError(error.message || "An unknown error occurred while processing.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };





  return (
    <div className={`flex flex-col bg-[#0a0a0a] text-gray-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300 ease-in-out ${(results || isFullscreen) ? 'h-screen overflow-hidden print:h-auto print:overflow-visible' : 'min-h-screen'} ${isFullscreen ? 'p-0' : ''}`}>

      {/* Background with Radials and Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none no-print">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]"></div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');

        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 4px; }

        @keyframes slideInFromRight { 0% { transform: translateX(80px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes slideInFromLeft { 0% { transform: translateX(-80px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        .animate-slide-next { animation: slideInFromRight 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-slide-prev { animation: slideInFromLeft 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

        .notebook-lines { background-image: repeating-linear-gradient(transparent, transparent 31px, rgba(148, 163, 184, 0.3) 31px, rgba(148, 163, 184, 0.3) 32px); background-size: 100% 32px; }
        .dark .notebook-lines { background-image: repeating-linear-gradient(transparent, transparent 31px, rgba(255, 255, 255, 0.05) 31px, rgba(255, 255, 255, 0.05) 32px); }
        .handwritten-text { font-family: 'Caveat', cursive; font-size: clamp(1.4rem, 5vw, 1.8rem); line-height: 2rem; letter-spacing: 0.02em; }
        
        @media print {
          @page { size: auto; margin: 15mm; }
          body, html, #root, main { 
            height: auto !important; 
            min-height: auto !important; 
            overflow: visible !important; 
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          div.min-h-screen { min-height: 0 !important; height: auto !important; overflow: visible !important; }
          
          nav, button, .no-print { display: none !important; }
          
          .printable-notebook { 
            width: 100% !important; 
            background: white !important; 
            color: black !important; 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            font-family: 'Times New Roman', Times, serif !important; 
            height: auto !important;
            overflow: visible !important;
          }
          .printable-notebook * { 
            color: black !important; 
            text-shadow: none !important; 
            background: transparent !important;
            border-color: #ccc !important;
          }
          
          .print-force-show { display: block !important; opacity: 1 !important; transform: none !important; animation: none !important; height: auto !important; overflow: visible !important; position: static !important; }
          .print-page-break { page-break-after: auto !important; margin-bottom: 20px !important; border: transparent !important; box-shadow: none !important; overflow: visible !important; min-height: 0 !important; }
          
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid !important; page-break-inside: avoid !important; }
          p, li { page-break-inside: avoid !important; }
          
          .printable-notebook h1, .printable-notebook h2, .printable-notebook h3 { font-family: 'Times New Roman', Times, serif !important; color: black !important; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
          .printable-notebook p { line-height: 1.6 !important; text-align: justify !important; margin-bottom: 15px !important; font-size: 11pt !important; }
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }

        @keyframes scan {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>


      {/* Floating Navbar */}
      {!isFullscreen && (
        <Navbar
          results={results}
          setResults={setResults}
          setFiles={setFiles}
          setSubject={setSubject}
          toggleFullscreen={toggleFullscreen}
        />
      )}

      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-[60] bg-[#121212] border border-[#262626] text-gray-400 hover:text-white p-2.5 rounded-full shadow-2xl transition-all hover:scale-110 no-print"
          title="Exit Fullscreen"
        >
          <Minimize size={18} />
        </button>
      )}

      <main ref={mainContainerRef} className={`relative z-10 w-full print:overflow-visible print:block print:h-auto ${(results || isFullscreen) ? 'flex-1 overflow-y-auto' : ''} ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0a0a]' : (results ? 'pt-8 pb-8' : 'pt-32 pb-20')}`}>
        <div className="mx-auto w-full max-w-7xl px-6">
          {!isFullscreen && !results && (
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
            />
          )}

          {results && (
            <ErrorBoundary>
              <div className="mt-8 md:mt-10 transition-all duration-300">
              {results.error && (
                <div className="no-print bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 md:p-6 mb-8 text-center animate-in fade-in flex flex-col items-center">
                  <AlertTriangle className="text-rose-500 mb-3" size={36} />
                  <h3 className="text-base md:text-lg font-bold text-rose-700 dark:text-rose-400 mb-1">Partial Generation Detected</h3>
                  <p className="text-rose-600 dark:text-rose-300 text-xs md:text-sm max-w-2xl">
                    {results.details || "The AI encountered a deeply complex file or reached its memory limits. Some tabs below might be empty. Try uploading fewer pages at once for a complete extraction."}
                  </p>
                </div>
              )}

              {!isFullscreen && (
                <div className="no-print flex gap-1 overflow-x-auto pb-4 mb-6 md:mb-8 border-b border-[#262626] transition-colors duration-300 no-scrollbar relative w-full items-center">
                  <div className="absolute left-0 bottom-4 w-full h-[1px] bg-[#262626]"></div>
                  {[
                    { id: 'formulas', icon: <Calculator size={14} /> },
                    { id: 'notes', icon: <FileText size={14} /> },
                    { id: 'flashcards', icon: <Layers size={14} /> },
                    { id: 'quiz', icon: <BrainCircuit size={14} /> }
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 font-mono text-xs md:text-sm flex items-center gap-2 capitalize transition-all duration-300 whitespace-nowrap relative z-10 ${activeTab === tab.id ? `text-white bg-[#121212] border border-[#262626] border-b-transparent rounded-t-lg` : 'text-gray-500 hover:text-gray-300 bg-transparent border border-transparent hover:bg-[#121212]/50'}`}>
                      {tab.icon} {tab.id}.md
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'formulas' && <FormulasTab formulas={results.formulas} />}

              {activeTab === 'notes' && <NotesTab notes={results.short_notes} />}

              {activeTab === 'flashcards' && <FlashcardsTab flashcards={results.flashcards} />}

              {activeTab === 'quiz' && <QuizTab files={files} subject={subject} isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} mainContainerRef={mainContainerRef} />}
            </div>
            </ErrorBoundary>
          )}
        </div>
      </main>

      {/* Premium High-Tech Footer */}
      {!isFullscreen && !results && (
        <Footer />
      )}
    </div>
  );
}