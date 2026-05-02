export const sanitizeFlashcardText = (text) => {
  if (!text) return "";
  // Normalize double-escaped backslashes that Gemini sometimes emits:
  // "\\times" (what JSON.parse gives us from \\\\times) → "\times"
  // This ensures KaTeX receives proper single-backslash LaTeX commands.
  return text.trim().replace(/\\\\([a-zA-Z{}\[\]()^_])/g, '\\$1');
};

export const sanitizeFormula = (text) => {
  if (!text) return "";
  text = text.trim();
  if (text.startsWith('$') || text.startsWith('\\[')) return text;
  return `$$${text}$$`;
};

export const chunkArray = (arr, size) => {
  if (!arr) return [];
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
};
