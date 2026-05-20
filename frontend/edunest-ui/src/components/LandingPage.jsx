/* eslint-disable */
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Sparkles, Zap, ArrowRight, UploadCloud,
  Calculator, FileText, Layers, BrainCircuit,
  CheckCircle, Lock, Clock, Cpu, Github
} from 'lucide-react';

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: Calculator,
    title: 'Formula Extraction',
    desc: 'Traces complex mathematical expressions and converts them into beautifully rendered LaTeX.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    glow: 'group-hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]',
    border: 'hover:border-blue-500/25',
  },
  {
    icon: FileText,
    title: 'Structured Notes',
    desc: 'Condensed, high-yield chapter summaries emphasising exam-critical concepts. No filler.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    glow: 'group-hover:shadow-[0_0_24px_rgba(16,185,129,0.2)]',
    border: 'hover:border-emerald-500/25',
  },
  {
    icon: Layers,
    title: 'Smart Flashcards',
    desc: 'Spaced-repetition cards auto-generated from core concepts so you retain more in less time.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    glow: 'group-hover:shadow-[0_0_24px_rgba(168,85,247,0.2)]',
    border: 'hover:border-purple-500/25',
  },
  {
    icon: BrainCircuit,
    title: 'Adaptive Exam Engine',
    desc: 'Simulate JEE / NEET exams with customisable difficulty, time-tracking, and AI explanations.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    glow: 'group-hover:shadow-[0_0_24px_rgba(244,63,94,0.2)]',
    border: 'hover:border-rose-500/25',
  },
];

const stats = [
  { value: '4-in-1', label: 'Study tools',  icon: Cpu },
  { value: '<60s',   label: 'To generate',  icon: Clock },
  { value: '100%',   label: 'Private data', icon: Lock },
  { value: 'Free',   label: 'Forever tier', icon: CheckCircle },
];

const steps = [
  { step: '01', title: 'Upload your document',  desc: 'Drop any PDF or photo — lecture slides, textbook pages, or handwritten notes.' },
  { step: '02', title: 'Pick a subject',         desc: 'Tell EduNest whether it\'s Physics, Chemistry, Maths, or Biology.' },
  { step: '03', title: 'Generate & study',       desc: 'Formulas, notes, flashcards and a full practice exam are ready in under a minute.' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const LandingPage = ({ onGetStarted }) => {
  const howRef = useRef(null);

  return (
    <div className="w-full">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-[88vh] px-6 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 dark:bg-indigo-600/8 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-[350px] h-[350px] bg-purple-500/8 dark:bg-purple-600/8 rounded-full blur-[110px] pointer-events-none" />

        {/* Version badge */}
        <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#111] border border-gray-300 dark:border-[#222] text-[11px] font-mono text-gray-500 mb-8">
          <Zap size={11} className="text-indigo-400 animate-pulse" />
          EduNest Engine v1.0
        </motion.div>

        {/* Headline — tighter, more balanced */}
        <motion.h1 {...fadeUp(0.07)} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.92] max-w-4xl mx-auto mb-6">
          <span className="text-gray-900 dark:text-white block">Turn raw documents</span>
          <span className="bg-gradient-to-br from-blue-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent block italic mt-1">
            into interactive learning.
          </span>
        </motion.h1>

        {/* Sub-headline — shorter, cleaner */}
        <motion.p {...fadeUp(0.14)} className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-10">
          Upload any PDF or image and get formulas, flashcards, structured notes, and a full practice exam — all in under 60 seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.21)} className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onGetStarted}
            className="group flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.97] transition-all shadow-[0_2px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
          >
            Start Learning Free
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-mono text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111]/60 hover:border-gray-400 dark:hover:border-[#3a3a3a] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
          >
            <UploadCloud size={15} />
            See how it works
          </button>
        </motion.div>

        {/* Stats bar */}
        <motion.div {...fadeUp(0.28)} className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 dark:bg-[#1e1e1e] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#1e1e1e] w-full max-w-xl shadow-md dark:shadow-xl">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-[#0d0d0d] px-5 py-4 flex flex-col items-center gap-1 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors">
              <Icon size={12} className="text-indigo-500 dark:text-indigo-400 mb-1" />
              <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">{value}</span>
              <span className="text-gray-500 dark:text-gray-500 font-mono text-[10px] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section ref={howRef} className="relative max-w-4xl mx-auto px-6 py-20">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <span className="inline-block font-mono text-[11px] text-indigo-400 uppercase tracking-widest border border-indigo-500/25 bg-indigo-500/5 px-3 py-1 rounded-full mb-4">
            How it works
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Three steps to mastery.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map(({ step, title, desc }, i) => (
            <motion.div key={step} {...fadeUp(i * 0.08)} className="group relative bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-7 hover:border-indigo-400/40 dark:hover:border-indigo-500/25 hover:bg-gray-50 dark:hover:bg-[#0f0f0f] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md dark:shadow-none">
              <span className="font-mono text-4xl font-black text-gray-200 dark:text-[#1c1c1c] group-hover:text-indigo-300 dark:group-hover:text-[#252525] transition-colors block mb-5 leading-none">{step}</span>
              <h3 className="text-gray-900 dark:text-white font-bold text-base mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <span className="inline-block font-mono text-[11px] text-purple-400 uppercase tracking-widest border border-purple-500/25 bg-purple-500/5 px-3 py-1 rounded-full mb-4">
            What you get
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Four tools. One upload.</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg, glow, border }, i) => (
            <motion.div key={title} {...fadeUp(i * 0.07)} className={`group flex flex-col h-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-gray-50 dark:hover:bg-[#0d0d0d] shadow-sm hover:shadow-md dark:shadow-none ${border}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${bg} ${glow}`}>
                <Icon className={color} size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative mt-20 pt-16 pb-8 border-t border-gray-200 dark:border-[#1a1a1a] overflow-hidden bg-gray-50/50 dark:bg-[#050505]">
        {/* Subtle glow effect */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-t-full blur-3xl pointer-events-none"></div>
        
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center gap-6 mb-12">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <GraduationCap className="text-white" size={18} />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">EduNest</span>
              <Sparkles size={12} className="text-indigo-400 opacity-80" />
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm">
              Transform any document into an interactive, high-yield learning experience powered by AI.
            </p>
            
            <div className="flex items-center gap-4">
              <a href="https://github.com/Keshariiii/edunest" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-[#111] border border-gray-200 dark:border-[#262626] flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm">
                <Github size={16} />
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 dark:text-gray-500 font-mono text-xs">
              © 2026 EduNest Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 dark:text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></span> Systems Operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
