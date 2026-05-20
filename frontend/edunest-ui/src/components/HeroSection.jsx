import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, UploadCloud, Trash2, Camera, FileText } from 'lucide-react';

const LOADING_STEPS = [
  'Uploading your files…',
  'Extracting text and figures…',
  'AI is analysing content…',
  'Building formulas & notes…',
  'Almost there…',
];

const ProcessingState = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex(i => (i + 1 < LOADING_STEPS.length ? i + 1 : i));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#262626] rounded-xl p-6 flex flex-col items-center gap-4">
      {/* Spinner */}
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-[#262626]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
      </div>

      {/* Step label */}
      <div className="text-center">
        <p className="text-gray-900 dark:text-white font-semibold text-sm">{LOADING_STEPS[stepIndex]}</p>
        <p className="text-gray-500 text-xs mt-1">This usually takes 20–60 seconds depending on file size.</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= stepIndex ? 'bg-indigo-500 w-5' : 'bg-gray-200 dark:bg-[#2a2a2a] w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

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
  handleGenerateBase,
  isOffline = false,
  rateLimitCooldown = 0,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Compact workspace header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-indigo-400" />
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Study Material Workspace</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          Upload a PDF or image of your notes, slides, or textbook pages to generate formulas, flashcards, notes, and a practice exam.
        </p>
      </div>

      {/* IDE-Style Upload Workspace */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-[#262626] shadow-2xl overflow-hidden text-left mx-auto max-w-2xl"
      >
        {/* Window bar */}
        <div className="bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-[#262626] px-4 py-3 flex items-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="mx-auto font-mono text-[10px] md:text-xs text-gray-500 flex items-center gap-2">
            <span className="text-indigo-400">~/edunest</span>/upload_workspace.js
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Subject selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => (
              <button
                key={sub}
                onClick={() => setSubject(sub)}
                className={`p-3 rounded-xl border font-mono text-xs transition-all duration-300 ${
                  subject === sub
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                    : 'bg-gray-50 dark:bg-[#171717] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:border-[#404040] hover:text-gray-800 dark:text-gray-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-8 flex flex-col items-center mb-6 transition-colors duration-300 ${
              isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-300 dark:border-[#333] bg-gray-50 dark:bg-[#0f0f0f] hover:border-gray-400 dark:hover:border-[#555]'
            }`}
          >
            <UploadCloud size={28} className={`mb-3 transition-all duration-300 ${isDragging ? 'text-indigo-400 scale-110' : 'text-gray-500'}`} />

            {/* Hidden file inputs */}
            <input
              type="file"
              id="up"
              accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
              multiple
              className="hidden"
              onClick={(e) => { e.target.value = ''; }}
              onChange={(e) => { if (e.target.files?.length) { setFiles(prev => [...prev, ...Array.from(e.target.files)]); } }}
            />
            {/* Camera capture — mobile only */}
            <input
              type="file"
              id="cam"
              accept="image/*"
              capture="environment"
              className="hidden"
              onClick={(e) => { e.target.value = ''; }}
              onChange={(e) => { if (e.target.files?.length) { setFiles(prev => [...prev, ...Array.from(e.target.files)]); } }}
            />

            <div className="flex flex-wrap gap-2 justify-center">
              <label htmlFor="up" className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg font-semibold cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm shadow-sm">
                <FileText size={14} /> Select Files
              </label>
              <label htmlFor="cam" className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#333] px-4 py-2 rounded-lg font-semibold cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all text-sm md:hidden">
                <Camera size={14} /> Scan Page
              </label>
            </div>
            <p className="mt-3 text-gray-500 font-mono text-[10px]">PDF · Image · DOCX · PPTX — drop or select</p>

            {files.length > 0 && (
              <div className="mt-5 flex flex-col gap-2 w-full">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#262626] p-3 rounded-lg animate-in slide-in-from-bottom-2 fade-in shadow-sm">
                    <p className="text-indigo-600 dark:text-indigo-300 font-mono text-xs flex items-center gap-2 truncate whitespace-nowrap overflow-hidden mr-4">
                      <span className="text-indigo-500">$</span> {f.name}
                    </p>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="w-full bg-red-500/10 border border-red-500/50 p-3 rounded-xl mb-4 text-red-400 text-xs text-center font-mono">
              {uploadError}
            </div>
          )}

          {/* Rate-limit cooldown bar */}
          {rateLimitCooldown > 0 && (
            <div className="w-full mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-[10px] text-amber-400">API cooling down — auto-retry in {rateLimitCooldown}s</span>
                <span className="font-mono text-[10px] text-gray-500">{rateLimitCooldown}/60s</span>
              </div>
              <div className="w-full h-1 bg-gray-200 dark:bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                  style={{ width: `${(rateLimitCooldown / 60) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit / Loading */}
          {loading ? (
            <ProcessingState />
          ) : (
            <button
              onClick={handleGenerateBase}
              disabled={loading || isOffline || rateLimitCooldown > 0}
              className={`w-full py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-sm ${
                isOffline || rateLimitCooldown > 0
                  ? 'bg-gray-200 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
              }`}
            >
              {isOffline
                ? 'Offline — Check Connection'
                : rateLimitCooldown > 0
                  ? `⏳ Retry in ${rateLimitCooldown}s`
                  : 'Initialize Processing'}
              {!isOffline && rateLimitCooldown === 0 && (
                <span className="font-mono text-xs bg-gray-700 dark:bg-gray-200 text-gray-200 dark:text-gray-800 px-1.5 py-0.5 rounded group-hover:bg-gray-600 dark:group-hover:bg-gray-300 transition-colors">⏎</span>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
