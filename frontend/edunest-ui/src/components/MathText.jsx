import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// throwOnError: false — if Gemini returns malformed LaTeX, render a red token
// instead of crashing the entire React tree and causing a black screen.
const KATEX_OPTIONS = { throwOnError: false, errorColor: '#ef4444' };

const MathText = ({ content }) => {
  if (!content) return null;
  return (
    // className moved here from <ReactMarkdown> — react-markdown v9+ removed that prop
    <div
      className="w-full overflow-x-auto pb-1 custom-scrollbar print:overflow-visible print:whitespace-pre-wrap print:mx-auto whitespace-pre-wrap font-sans block math-content"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MathText;
