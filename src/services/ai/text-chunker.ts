/**
 * Persian Text Chunking Utility
 * Optimised specifically for Persian syntax rules:
 * - Sentence boundaries: '.', '؟', '؛', '!', '\n', '\r'
 * - Persian quotes: '«', '»'
 * - Zero-width non-joiner (نیم‌فاصله): '\u200C' (Do NOT break words at this character)
 * - Sentence boundary preservation & overlap for RAG
 */

export function chunkText(
  text: string,
  maxChunkSize: number,
  overlap: number
): string[] {
  if (!text) return [];
  if (maxChunkSize <= 0) return [text];
  const actualOverlap = overlap >= maxChunkSize ? Math.floor(maxChunkSize / 2) : overlap;

  // Pattern for split boundary detection
  const sentenceBoundaryRegex = /([.؟؛!\n\r]+)/g;

  // Split the text into segments including the delimiters so we can rebuild sentences perfectly
  const parts = text.split(sentenceBoundaryRegex);
  const sentences: string[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    const sentenceText = parts[i] || '';
    const delimiterText = parts[i + 1] || '';
    const combined = sentenceText + delimiterText;
    if (combined.trim()) {
      sentences.push(combined);
    }
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // Handle edge case: single sentence is extremely long and exceeds maxChunkSize
    if (sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Perform fallback safe-character splitting directly inside the giant sentence
      let startIdx = 0;
      while (startIdx < sentence.length) {
        let endIdx = startIdx + maxChunkSize;
        if (endIdx > sentence.length) {
          endIdx = sentence.length;
        } else {
          // Prevent breaking right at a zero-width non-joiner (نیم‌فاصله)
          if (sentence.charAt(endIdx) === '\u200C' || sentence.charAt(endIdx - 1) === '\u200C') {
            // Adjust boundary backward safely
            while (endIdx > startIdx && (sentence.charAt(endIdx) === '\u200C' || sentence.charAt(endIdx - 1) === '\u200C')) {
              endIdx--;
            }
          }
          // Prevent breaking inside a word if possible by moving back to a space
          if (endIdx < sentence.length && sentence.charAt(endIdx) !== ' ' && sentence.charAt(endIdx - 1) !== ' ') {
            const lastSpace = sentence.lastIndexOf(' ', endIdx);
            if (lastSpace > startIdx) {
              endIdx = lastSpace;
            }
          }
        }

        const chunkSegment = sentence.substring(startIdx, endIdx);
        if (chunkSegment.trim()) {
          chunks.push(chunkSegment.trim());
        }

        startIdx = endIdx === sentence.length ? sentence.length : endIdx - actualOverlap;
        if (startIdx >= sentence.length || chunkSegment.length <= actualOverlap) {
          // Avoid infinite loops
          startIdx = endIdx;
        }
      }
      continue;
    }

    // Normal chunk assembly
    const potentialChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    if (potentialChunk.length <= maxChunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // Handle overlap rebuild across consecutive chunks if necessary
  if (actualOverlap > 0 && chunks.length > 1) {
    const overlappingChunks: string[] = [];
    overlappingChunks.push(chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const currentChunkText = chunks[i];

      // Retrieve suffix of overlap size from previous chunk
      let overlapStartIndex = prevChunk.length - actualOverlap;
      if (overlapStartIndex < 0) overlapStartIndex = 0;

      // Ensure we don't slice middle of \u200C
      if (prevChunk.charAt(overlapStartIndex) === '\u200C' || prevChunk.charAt(overlapStartIndex - 1) === '\u200C') {
        while (overlapStartIndex < prevChunk.length && (prevChunk.charAt(overlapStartIndex) === '\u200C' || prevChunk.charAt(overlapStartIndex - 1) === '\u200C')) {
          overlapStartIndex++;
        }
      }

      const overlapText = prevChunk.substring(overlapStartIndex).trim();
      const prependedChunk = overlapText ? `${overlapText} ${currentChunkText}` : currentChunkText;
      overlappingChunks.push(prependedChunk);
    }
    return overlappingChunks;
  }

  return chunks;
}
