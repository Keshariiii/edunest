import React from 'react';
import { Layers } from 'lucide-react';
import MathText from './MathText';
import { sanitizeFlashcardText } from '../utils/helpers';

const Flashcard = ({ front, back, index, total, direction, isFlipped, setIsFlipped }) => {
  const progress = ((index + 1) / total) * 100;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Sleek Ultra-Thin Progress Bar */}
      <div className="w-full max-w-2xl h-[2px] bg-[#262626] rounded-full overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={`relative w-full h-[320px] md:h-80 cursor-pointer group ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'} perspective-[1500px]`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className="w-full h-full relative transition-[transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Faint ambient glow effect underneath */}
          <div className="absolute inset-0 bg-indigo-500/10 blur-[50px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          {/* Front */}
          <div
            className="absolute w-full h-full border border-[#262626] rounded-2xl bg-[#121212] flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 ease-in-out group-hover:border-[#404040]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(1px)',
              boxShadow: 'inset 0 0 60px rgba(99, 102, 241, 0.02)'
            }}
          >
            <div className="text-lg md:text-2xl font-medium text-gray-100 leading-relaxed w-full z-10 font-sans px-4">
              <MathText content={sanitizeFlashcardText(front)} />
            </div>
            <span className="absolute bottom-6 text-xs font-mono text-gray-500 flex items-center gap-2 transition-transform group-hover:-translate-y-1">Click to reveal <Layers size={14} /></span>
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full border border-[#262626] rounded-2xl bg-[#121212] flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 ease-in-out group-hover:border-[#404040]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)',
              boxShadow: 'inset 0 0 60px rgba(167, 139, 250, 0.02)'
            }}
          >
            <span className="absolute top-6 left-6 text-[10px] font-mono text-gray-400 tracking-widest uppercase opacity-70">Answer</span>
            <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center py-10">
              <div className="text-base md:text-xl font-medium text-gray-100 leading-relaxed w-full z-10 font-sans px-4 text-left">
                <MathText content={sanitizeFlashcardText(back)} />
              </div>
            </div>
            <span className="absolute bottom-6 text-xs font-mono text-gray-500 flex items-center gap-2 opacity-70">Click to flip back</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
