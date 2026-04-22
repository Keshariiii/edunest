export const sanitizeFlashcardText = (text) => text ? text.trim() : "";

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
