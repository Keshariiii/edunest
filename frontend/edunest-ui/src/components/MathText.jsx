import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.min.js'; // enables \ce{...} chemical notation

// throwOnError: false — if Gemini returns malformed LaTeX, render a red token
// instead of crashing the entire React tree and causing a black screen.
const KATEX_OPTIONS = { throwOnError: false, errorColor: '#ef4444' };

// LaTeX command patterns that indicate math content.
// Extended to include \text, \xrightarrow, \textcolor, \overset etc.
// which Gemini commonly uses but were previously missing from this list.
const LATEX_COMMANDS = /\\(frac|sqrt|sum|int|prod|lim|infty|times|div|cdot|pm|mp|leq|geq|neq|approx|equiv|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|omega|Omega|Delta|Sigma|vec|hat|bar|dot|ddot|partial|nabla|forall|exists|notin|subset|cup|cap|ldots|cdots|rightarrow|leftarrow|Rightarrow|Leftrightarrow|xrightarrow|xleftarrow|xLeftrightarrow|overset|underset|text|mathrm|mathbf|mathit|mathcal|mathbb|operatorname|ce|textcolor|colorbox|boxed|overbrace|underbrace|stackrel|cfrac|dfrac|tfrac|binom|dbinom|tbinom|Vert|vert|langle|rangle|lfloor|rfloor|lceil|rceil|mid|parallel|perp|angle|triangle|square|circ|bullet|dagger|ell|hbar|Re|Im|because|therefore|propto|sim|simeq|cong|ne|in|ni|subseteq|supseteq|setminus|emptyset|varnothing|land|lor|lnot|iff|implies|top|bot|begin|end|left|right|big|Big|bigg|Bigg)\b/;

// Math notation: catches b^2, (a+b)^2, a^{m+n}, x_n, x_{i+1} etc.
const MATH_NOTATION = /[\w)}\]][\^][\w{(]|[\w]\s*_\s*[\w{(]|[\^][\w{(]|_[\w{(]/;

/**
 * Normalize double-escaped backslashes that can occasionally survive from
 * Gemini's JSON output (e.g. \\frac stays as \\frac in cached localStorage).
 * JSON.parse handles the standard case on fresh responses, but cached strings
 * sometimes retain the double-escape.
 */
const normalizeLaTeX = (text) => {
  if (!text) return text;
  // Only run when double-escaped backslashes are detected
  if (text.includes('\\\\')) {
    return text.replace(/\\\\([a-zA-Z{}\[\]()^_|])/g, '\\$1');
  }
  return text;
};

/**
 * Safety-net: wraps content in $$...$$ if it looks like raw undelimited LaTeX.
 * Only fires when: text has no existing delimiters, contains LaTeX commands or
 * math notation, AND the text looks predominantly mathematical (not a sentence).
 */
const fixMathDelimiters = (text) => {
  if (!text) return text;

  // Already has $...$ delimiters — trust the AI got it right
  if (text.includes('$')) return text;
  // Already has \[...\] block math delimiters
  if (text.includes('\\[')) return text;

  const hasLatexCommand = LATEX_COMMANDS.test(text);
  const hasMathNotation = MATH_NOTATION.test(text);

  if (hasLatexCommand || hasMathNotation) {
    // Heuristic: only auto-wrap if text is predominantly math, not natural language.
    // Criteria:
    //   - ≤8 words  (short formulas)
    //   - >25% non-alpha chars  (heavy math symbols)
    //   - starts with a backslash  (\text{...} = ..., \frac{...}{...} etc.)
    const words = text.trim().split(/\s+/);
    const mathChars = (text.match(/[^a-zA-Z\s]/g) || []).length;
    const mathRatio = mathChars / text.length;
    const startsWithLatex = /^\s*\\/.test(text);
    const isPredominantlyMath = words.length <= 8 || mathRatio > 0.25 || startsWithLatex;

    if (isPredominantlyMath) {
      return `$$${text}$$`;
    }
  }

  return text;
};

const MathText = ({ content }) => {
  if (!content) return null;
  const normalized = normalizeLaTeX(content);
  const processed = fixMathDelimiters(normalized);
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
