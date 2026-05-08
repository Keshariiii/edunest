import React, { useState } from 'react';
import Flashcard from './Flashcard';
import { FlashcardsSkeleton } from './SkeletonLoader';

const FlashcardsTab = ({ flashcards, loading = false }) => {
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [flashcardDirection, setFlashcardDirection] = useState('next');

  if (loading) return <FlashcardsSkeleton />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {flashcards && flashcards.length > 0 ? (
        <>
          <Flashcard
            key={currentFlashcardIndex}
            front={flashcards[currentFlashcardIndex]?.front}
            back={flashcards[currentFlashcardIndex]?.back}
            index={currentFlashcardIndex}
            total={flashcards.length}
            direction={flashcardDirection}
            isFlipped={isFlashcardFlipped}
            setIsFlipped={setIsFlashcardFlipped}
          />
          <div className="flex gap-2 mt-8 w-full justify-center px-4 font-mono pb-safe">
            <button
              onClick={() => { setIsFlashcardFlipped(false); setFlashcardDirection('prev'); setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1)); }}
              disabled={currentFlashcardIndex === 0}
              className="flex-1 max-w-[140px] min-h-[44px] px-5 py-2.5 bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#262626] rounded-md text-xs hover:text-gray-900 dark:text-white hover:border-gray-300 dark:border-[#404040] disabled:opacity-30 transition-all touch-manipulation"
            >← Prev</button>
            <button
              onClick={() => { setIsFlashcardFlipped(false); setFlashcardDirection('next'); setCurrentFlashcardIndex(Math.min((flashcards.length || 1) - 1, currentFlashcardIndex + 1)); }}
              disabled={currentFlashcardIndex === (flashcards.length || 1) - 1}
              className="flex-1 max-w-[140px] min-h-[44px] px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-md font-bold text-xs hover:bg-gray-800 disabled:opacity-30 transition-all touch-manipulation"
            >Next →</button>
          </div>
        </>
      ) : (
        <div className="w-full p-12 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded-xl transition-colors duration-300 flex flex-col items-center justify-center">
          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 text-left bg-[#fafafa] dark:bg-[#0a0a0a] p-6 rounded-md border border-gray-200 dark:border-[#262626] w-full max-w-md shadow-inner">
            <div className="mb-2">
              <span className="text-gray-600 mr-2">{'>'}</span>Analysis complete.
            </div>
            <div>
              <span className="text-gray-600 mr-2">{'>'}</span>Could not extract clear Q/A pairs from the source document.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsTab;
