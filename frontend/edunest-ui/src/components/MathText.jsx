import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// throwOnError: false — if Gemini returns malformed LaTeX, render a red token
// instead of crashing the entire React tree and causing a black screen.
const KATEX_OPTIONS = { throwOnError: false, errorColor: '#ef4444' };

// LaTeX command patterns that indicate math content
const LATEX_COMMANDS = /\\(frac|sqrt|sum|int|prod|lim|infty|times|div|cdot|pm|mp|leq|geq|neq|approx|equiv|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|omega|Omega|Delta|Sigma|vec|hat|bar|dot|ddot|partial|nabla|forall|exists|notin|subset|cup|cap|ldots|cdots|rightarrow|leftarrow|Rightarrow|Leftrightarrow)\b/;

// Math notation: catches b^2, (a+b)^2, a^{m+n}, x_n, x_{i+1} etc.
const MATH_NOTATION = /[\w)}\]]\^[\w{(]|[\w]\s*_\s*[\w{(]|\^[\w{(]|_[\w{(]/;

/**
 * Safety-net: wraps content in $...$ if it looks like raw undelimited LaTeX.
 * Only fires when: text has no existing delimiters, contains LaTeX commands or
 * math notation, AND the text looks predominantly mathematical (not a sentence).
 */
const fixMathDelimiters = (text) => {
  if (!text) return text;

  // Already has $...$ delimiters — trust the AI got it right
  if (text.includes('$')) return text;

  const hasLatexCommand = LATEX_COMMANDS.test(text);
  const hasMathNotation = MATH_NOTATION.test(text);

  if (hasLatexCommand || hasMathNotation) {
    // Heuristic: only auto-wrap if text is predominantly math, not natural language.
    // "predominantly math" = ≤6 words OR >30% of chars are math/operator chars.
    const words = text.trim().split(/\s+/);
    const mathChars = (text.match(/[^a-zA-Z\s]/g) || []).length;
    const mathRatio = mathChars / text.length;
    const isPredominantlyMath = words.length <= 6 || mathRatio > 0.30;

    if (isPredominantlyMath) {
      return `$${text}$`;
    }
  }

  return text;
};

const MathText = ({ content }) => {
  if (!content) return null;
  const processed = fixMathDelimiters(content);
  return (
    <div
      className="w-full overflow-x-auto pb-1 custom-scrollbar print:overflow-visible print:whitespace-pre-wrap print:mx-auto font-sans block math-content"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

export default MathText;

