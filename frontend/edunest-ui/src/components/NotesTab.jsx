import React, { useState } from 'react';
import { Download } from 'lucide-react';
import MathText from './MathText';
import { chunkArray } from '../utils/helpers';

const NotesTab = ({ notes }) => {
  const [currentNotePage, setCurrentNotePage] = useState(0);
  const [noteDirection, setNoteDirection] = useState('next');

  const handlePrint = () => {
    window.print();
  };

  const noteChunks = chunkArray(notes || [], 10);

  return (
    <div className="printable-notebook w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
       {notes && notes.length > 0 && (
        <button onClick={handlePrint} className="no-print absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[#0a0a0a] text-gray-300 border border-[#262626] hover:border-gray-500 hover:text-white px-3 py-1.5 rounded-md font-mono text-[10px] transition-all">
          <Download size={14} /> Save_PDF
        </button>
      )}
      {notes && notes.length > 0 ? (
          <div className="w-full">
            {noteChunks.map((chunk, pageIndex) => (
              <div key={pageIndex} className={`bg-[#121212] rounded-xl border border-[#262626] shadow-2xl overflow-hidden min-h-[400px] mb-8 print-force-show print:!mb-8 print:!min-h-0 print:!shadow-none print:break-inside-avoid ${pageIndex === currentNotePage ? `block ${noteDirection === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}` : 'hidden'}`}>
                {/* IDE Window Header */}
                <div className="bg-[#171717] border-b border-[#262626] px-4 py-2.5 flex items-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto font-mono text-[10px] text-gray-500 flex items-center gap-2">
                    <span className="text-gray-400 font-bold">notes.md</span>
                    <span className="text-gray-600"> — {pageIndex + 1}/{noteChunks.length}</span>
                  </div>
                </div>

                <div className="p-8 md:p-12 pb-20 font-sans text-gray-300">
                  <h3 className="font-bold mb-10 text-white flex items-baseline gap-3 text-3xl tracking-tight">
                    # Chapter Overview
                  </h3>
                  <ul className="flex flex-col gap-6 w-full font-sans">
                    {chunk?.map((note, i) => {
                      const actualIndex = pageIndex * 10 + i + 1;
                      const noteText = typeof note === 'string' ? note : (note?.note || note?.text || note?.content || JSON.stringify(note) || "");
                      return (
                        <li key={i} className="flex gap-4 items-start group w-full">
                          <span className="font-mono text-gray-600 text-xs pt-1.5 shrink-0">[{actualIndex.toString().padStart(2, '0')}]</span>
                          <div className="text-gray-300 leading-relaxed text-[15px] group-hover:text-white transition-colors w-full overflow-x-auto custom-scrollbar markdown-math">
                            <MathText content={noteText} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
            {noteChunks.length > 1 && (
              <div className="flex gap-2 mt-2 w-full justify-center px-2 font-mono">
                <button onClick={() => { setNoteDirection('prev'); setCurrentNotePage(Math.max(0, currentNotePage - 1)); }} disabled={currentNotePage === 0} className="px-4 py-2 bg-[#121212] border border-[#262626] text-gray-400 rounded-md text-xs hover:text-white hover:border-[#404040] disabled:opacity-30 transition-all">&lt; Prev</button>
                <div className="flex items-center justify-center px-4 text-gray-500 text-xs">{currentNotePage + 1} / {noteChunks.length}</div>
                <button onClick={() => { setNoteDirection('next'); setCurrentNotePage(Math.min(noteChunks.length - 1, currentNotePage + 1)); }} disabled={currentNotePage === noteChunks.length - 1} className="px-4 py-2 bg-white text-black rounded-md font-bold text-xs hover:bg-gray-200 disabled:opacity-30 transition-all">Next &gt;</button>
              </div>
            )}
          </div>
      ) : (
        <div className="p-12 bg-[#121212] border border-[#262626] rounded-xl flex flex-col items-center justify-center">
          <div className="font-mono text-sm text-gray-400 text-left bg-[#0a0a0a] p-6 rounded-md border border-[#262626] w-full max-w-md shadow-inner">
            <div className="mb-2">
              <span className="text-gray-600 mr-2">{'>'}</span>Analysis complete.
            </div>
            <div>
              <span className="text-gray-600 mr-2">{'>'}</span>Insufficient text density to abstract meaningful notes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;
