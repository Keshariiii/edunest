import React from 'react';
import { BookOpen, BrainCircuit, Timer, LineChart, Sparkles, ArrowRight, Lock } from 'lucide-react';

export default function Dashboard({ user, onOpenWorkshop, onOpenDoubtSolver, onOpenStudyTimer }) {
  const firstName = user?.username || 'Student';

  const features = [
    {
      id: 'workshop',
      title: 'Study Material Workshop',
      description: 'Upload your notes or slides to instantly generate formulas, flashcards, and practice quizzes.',
      icon: <BookOpen className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
      action: onOpenWorkshop,
      actionText: 'Open Workshop',
      status: 'active'
    },
    {
      id: 'doubt_solver',
      title: 'AI Chatbot',
      description: 'Stuck on a concept? Chat with an AI tutor trained on your specific study materials.',
      icon: <BrainCircuit className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      action: onOpenDoubtSolver,
      actionText: 'Open AI Chatbot',
      status: 'active'
    },
    {
      id: 'study_timer',
      title: 'Study Timer',
      description: 'Track focus sessions, set intervals, and optimize your study flow with an interactive stopwatch and countdown timer.',
      icon: <Timer className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      action: onOpenStudyTimer,
      actionText: 'Open Study Timer',
      status: 'active'
    },
    {
      id: 'analytics',
      title: 'Performance Analytics',
      description: 'Track your quiz scores, identify weak areas, and monitor your learning progress over time.',
      icon: <LineChart className="w-6 h-6 text-rose-500 dark:text-rose-400" />,
      color: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
      action: null,
      status: 'coming_soon'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Welcome back, {firstName} <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg">
          What would you like to focus on today?
        </p>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div 
            key={feature.id}
            onClick={feature.status === 'active' ? feature.action : undefined}
            className={`
              relative group overflow-hidden rounded-2xl border p-8 transition-all duration-300
              ${feature.status === 'active' 
                ? `cursor-pointer bg-white dark:bg-[#121212] border-gray-200 dark:border-[#262626] hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5` 
                : `cursor-default bg-gray-50/50 dark:bg-[#121212]/50 border-gray-200/50 dark:border-[#262626]/50 opacity-90`}
            `}
          >
            {/* Active Card Glow */}
            {feature.status === 'active' && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/0 group-hover:to-indigo-500/5 dark:group-hover:to-indigo-500/10 transition-colors duration-500" />
            )}

            {/* Coming Soon Badge */}
            {feature.status === 'coming_soon' && (
              <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <Lock size={12} />
                Coming Soon
              </div>
            )}

            {/* Active Badge for AI Chatbot */}
            {feature.id === 'doubt_solver' && feature.status === 'active' && (
              <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={12} />
                NEW
              </div>
            )}

            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 border ${feature.color}`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8 pr-8">
                {feature.description}
              </p>

              {feature.status === 'active' && (
                <button 
                  className={`flex items-center gap-2 font-semibold group-hover:gap-3 transition-all duration-300 ${
                    feature.id === 'doubt_solver' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {feature.actionText} <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
