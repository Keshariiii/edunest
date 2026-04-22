import React, { useState } from 'react';
import { Download } from 'lucide-react';
import MathText from './MathText';
import { sanitizeFormula, chunkArray } from '../utils/helpers';

const FormulasTab = ({ formulas }) => {
  const [currentFormulaPage, setCurrentFormulaPage] = useState(0);
  const [formulaDirection, setFormulaDirection] = useState('next');

  const handlePrint = () => {
    window.print();
  };

  const formulaChunks = chunkArray(formulas || [], 10);

  return (
    <div className="printable-notebook w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {formulas && formulas.length > 0 && (
        <button onClick={handlePrint} className="no-print absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[#0a0a0a] text-gray-300 border border-[#262626] hover:border-gray-500 hover:text-white px-3 py-1.5 rounded-md font-mono text-[10px] transition-all">
          <Download size={14} /> Save_PDF
        </button>
      )}
      {formulas && formulas.length > 0 ? (
          <div className="w-full">
            {formulaChunks.map((chunk, pageIndex) => (
              <div key={pageIndex} className={`bg-[#121212] rounded-xl border border-[#262626] shadow-2xl overflow-hidden min-h-[400px] mb-8 print-force-show print:!mb-8 print:!min-h-0 print:!shadow-none print:break-inside-avoid ${pageIndex === currentFormulaPage ? `block ${formulaDirection === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}` : 'hidden'}`}>
                {/* IDE Window Header */}
                <div className="bg-[#171717] border-b border-[#262626] px-4 py-2.5 flex items-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto font-mono text-[10px] text-gray-500 flex items-center gap-2">
                    <span className="text-gray-400 font-bold">formulas.md</span> {/* Line marker mock */}
                    <span className="text-gray-600"> — {pageIndex + 1}/{formulaChunks.length}</span>
                  </div>
                </div>

                <div className="p-8 md:p-12 pb-20 font-sans text-gray-300">
                  <h3 className="font-bold mb-10 text-white flex items-baseline gap-3 text-3xl tracking-tight">
                    # Extracted Formulas
                  </h3>
                  <div className="flex flex-col gap-8 w-full">
                    {chunk?.map((f, i) => {
                      const actualIndex = pageIndex * 10 + i + 1;
                      return (
                        <div key={i} className="flex flex-col gap-2 group w-full border-l-2 border-[#262626] pl-6 hover:border-indigo-500/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-gray-600 text-xs">[{actualIndex.toString().padStart(2, '0')}]</span>
                            <span className="text-white font-semibold text-lg">{f?.name}</span>
                          </div>
                          <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#262626] overflow-x-auto text-white mt-2">
                            <MathText content={sanitizeFormula(f?.equation)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {formulaChunks.length > 1 && (
              <div className="flex gap-2 mt-2 w-full justify-center px-2 font-mono">
                <button onClick={() => { setFormulaDirection('prev'); setCurrentFormulaPage(Math.max(0, currentFormulaPage - 1)); }} disabled={currentFormulaPage === 0} className="px-4 py-2 bg-[#121212] border border-[#262626] text-gray-400 rounded-md text-xs hover:text-white hover:border-[#404040] disabled:opacity-30 transition-all">&lt; Prev</button>
                <div className="flex items-center justify-center px-4 text-gray-500 text-xs">{currentFormulaPage + 1} / {formulaChunks.length}</div>
                <button onClick={() => { setFormulaDirection('next'); setCurrentFormulaPage(Math.min(formulaChunks.length - 1, currentFormulaPage + 1)); }} disabled={currentFormulaPage === formulaChunks.length - 1} className="px-4 py-2 bg-white text-black rounded-md font-bold text-xs hover:bg-gray-200 disabled:opacity-30 transition-all">Next &gt;</button>
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
              <span className="text-gray-600 mr-2">{'>'}</span>0 mathematical expressions detected in the source document.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulasTab;
