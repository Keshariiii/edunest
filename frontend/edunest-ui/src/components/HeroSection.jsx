import React from 'react';
import { motion } from 'framer-motion';
import { Zap, UploadCloud, Trash2 } from 'lucide-react';
import Features from '../Features';

const HeroSection = ({
  subject,
  setSubject,
  isDragging,
  setIsDragging,
  handleDrop,
  files,
  setFiles,
  removeFile,
  uploadError,
  loading,
  handleGenerateBase
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#262626] text-xs font-mono text-gray-400 mb-6">
          <Zap size={12} className="text-indigo-400" /> EduNest Engine v1.0
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="block w-full"
        >
          <h1 className="text-5xl md:text-7xl tracking-tight mb-8 flex flex-col items-center gap-2">
            <span className="font-light text-slate-300">Turn raw documents into</span>
            <span className="font-extrabold italic text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-cyan-300 mt-2">interactive learning.</span>
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="uppercase tracking-widest text-xs md:text-sm text-gray-400 font-semibold leading-relaxed max-w-4xl mx-auto border-y border-[#262626] py-6 bg-[#121212]/30 mb-12">
          Upload your PDFs and instantly generate formulas, flashcards, chapter notes, and rigorous practice exams using our advanced analysis pipeline.
        </motion.p>
        
        {/* IDE-Style Workspace Window */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-[#121212] rounded-2xl border border-[#262626] shadow-2xl overflow-hidden text-left mx-auto max-w-2xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="bg-[#171717] border-b border-[#262626] px-4 py-3 flex items-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="mx-auto font-mono text-[10px] md:text-xs text-gray-500 flex items-center gap-2">
              <span className="text-indigo-400">~/edunest</span>/upload_workspace.js
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => (
                <button key={sub} onClick={() => setSubject(sub)} className={`p-3 rounded-xl border font-mono text-xs transition-all duration-300 ${subject === sub ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-[#171717] text-gray-400 border-[#262626] hover:border-[#404040] hover:text-gray-200'}`}>{sub}</button>
              ))}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-8 flex flex-col items-center mb-6 transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#333] bg-[#0f0f0f] hover:border-[#555]'}`}
            >
              <UploadCloud size={32} className={`mb-4 transition-all duration-300 ${isDragging ? 'text-indigo-400 scale-110' : 'text-gray-500'}`} />
              <input type="file" id="up" accept=".pdf,image/*" multiple className="hidden" onClick={(e) => { e.target.value = ''; }} onChange={(e) => { if (e.target.files?.length) { setFiles(prev => [...prev, ...Array.from(e.target.files)]); } }} />
              <label htmlFor="up" className="bg-white text-black px-5 py-2.5 rounded-lg font-semibold cursor-pointer hover:bg-gray-200 transition-colors text-sm">Select Files</label>
              <p className="mt-4 text-gray-500 font-mono text-[10px] md:text-xs">Drop PDFs or Images here</p>

              {files.length > 0 && (
                <div className="mt-6 flex flex-col gap-2 w-full">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#171717] border border-[#262626] p-3 rounded-lg animate-in slide-in-from-bottom-2 fade-in">
                      <p className="text-indigo-300 font-mono text-xs flex items-center gap-2 truncate whitespace-nowrap overflow-hidden mr-4">
                        <span className="text-indigo-500">$</span> {f.name}
                      </p>
                      <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadError && (
              <div className="w-full bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-4 text-red-400 text-sm text-center">
                <strong>Upload failed:</strong> {uploadError}
              </div>
            )}

            {loading ? (
              <div className="w-full bg-[#0f0f0f] p-5 rounded-xl border border-[#262626] flex flex-col items-center justify-center shadow-inner">
                <div className="flex justify-between w-full mb-3 px-1">
                  <span className="font-mono text-[10px] md:text-xs text-indigo-400 animate-pulse uppercase tracking-widest">Running extraction engine...</span>
                </div>
                <div className="w-full h-1.5 bg-[#171717] rounded-full overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 w-1/3 bg-indigo-500 animate-[scan_1.5s_ease-in-out_infinite] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                </div>
              </div>
            ) : (
              <button onClick={handleGenerateBase} disabled={loading} className="w-full bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                 Initialize Processing <span className="font-mono text-xs bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded group-hover:bg-gray-300 transition-colors">⏎</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Features Component */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <Features />
      </motion.div>
    </div>
  );
};

export default HeroSection;
