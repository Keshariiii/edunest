import React from 'react';
import { Calculator, Layers, FileText, BrainCircuit } from 'lucide-react';

const features = [
  {
    title: 'Automated Formula Extraction',
    description: 'Our computer vision models trace complex mathematical expressions and convert them into beautifully rendered mathematical syntax for quick reference.',
    icon: Calculator,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    hoverBorder: 'hover:border-blue-500/30',
    hoverGlow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
  },
  {
    title: 'Smart Flashcards',
    description: 'Instantly generated spaced-repetition cards derived from core concepts.',
    icon: Layers,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    hoverBorder: 'hover:border-purple-500/30',
    hoverGlow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
  },
  {
    title: 'Structured Notes',
    description: 'Concise, bulleted summaries emphasizing high-yield exam material.',
    icon: FileText,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    hoverBorder: 'hover:border-emerald-500/30',
    hoverGlow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
  },
  {
    title: 'Adaptive Exam Engine',
    description: 'Simulate real-world testing environments (JEE/NEET) with customizable difficulty, accurate time-tracking, and highly detailed answer explanations with step-by-step logic.',
    icon: BrainCircuit,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10',
    hoverBorder: 'hover:border-rose-500/30',
    hoverGlow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'
  }
];

export default function Features() {
  return (
    <section className="relative w-full mt-24">
      {/* Subtle background radial gradient for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index} 
              className={`group flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.03] ${feature.hoverBorder}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${feature.iconBg} ${feature.hoverGlow}`}>
                <Icon className={`${feature.iconColor}`} size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
