export const EMBEDDING_CHUNK_SIZE = 3200;
export const EMBEDDING_CHUNK_OVERLAP_WORDS = 30;

export type DocumentChunk = {
  index: number;
  title: string;
  text: string;
  characterCount: number;
};

export function chunkDocument(
  text: string,
  maxCharacters = EMBEDDING_CHUNK_SIZE,
  overlapWords = EMBEDDING_CHUNK_OVERLAP_WORDS,
): DocumentChunk[] {
  if (maxCharacters <= 0 || overlapWords < 0) {
    throw new Error("Chunk size must be positive and overlap cannot be negative.");
  }

  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const pieces = splitOversizedText(paragraph, maxCharacters, overlapWords);

    for (const piece of pieces) {
      const candidate = current ? `${current}\n\n${piece}` : piece;
      if (candidate.length <= maxCharacters) {
        current = candidate;
        continue;
      }

      if (current) chunks.push(current);
      const overlap = getLastWords(current, overlapWords);
      current = overlap && overlap.length + piece.length <= maxCharacters
        ? `${overlap}\n\n${piece}`
        : piece;
    }
  }

  if (current) chunks.push(current);

  return chunks.map((chunk, index) => ({
    index,
    title: createChunkTitle(chunk, index),
    text: chunk,
    characterCount: chunk.length,
  }));
}

function createChunkTitle(chunk: string, index: number) {
  const firstLine = chunk.split("\n")[0].trim();
  const heading = firstLine.match(/^(?:section\s+)?(?:\d+(?:\.\d+)*[.)]?\s+)?([A-Z][A-Za-z\s/&-]{3,70})$/)?.[1];
  const firstSentence = chunk.match(/^(.+?[.!?])(?:\s|$)/)?.[1] || firstLine;
  const topic = getLegalTopic(chunk);
  const title = heading || topic || firstSentence;

  return `${title.slice(0, 96).trimEnd()}${title.length > 96 ? "..." : ""}` || `Document section ${index + 1}`;
}

function getLegalTopic(chunk: string) {
  const topicPatterns: Array<[RegExp, string]> = [
    [/confidential|non-disclosure|trade secret/i, "Confidentiality and non-disclosure"],
    [/terminat(?:e|ion)|expires|expiration/i, "Termination and expiry"],
    [/indemnif|hold harmless|liabilit/i, "Indemnity and liability"],
    [/governing law|jurisdiction|venue/i, "Governing law and jurisdiction"],
    [/payment|invoice|fee(?:s)?|compensation/i, "Payment and fees"],
    [/intellectual property|copyright|trademark|ownership/i, "Intellectual property and ownership"],
    [/warrant(?:y|ies)|represent(?:s|ation)|covenant/i, "Representations and warranties"],
    [/personal data|privacy|data protection|gdpr/i, "Privacy and data protection"],
    [/notice|written communication/i, "Notices and communications"],
  ];

  return topicPatterns.find(([pattern]) => pattern.test(chunk))?.[1];
}

function splitOversizedText(text: string, maxCharacters: number, overlapWords: number) {
  if (text.length <= maxCharacters) return [text];

  const pieces: string[] = [];
  const words = text.split(/\s+/);
  let start = 0;

  while (start < words.length) {
    let end = start;
    let length = 0;
    while (end < words.length && length + words[end].length + (length ? 1 : 0) <= maxCharacters) {
      length += words[end].length + (length ? 1 : 0);
      end += 1;
    }

    if (end === start) end += 1;
    pieces.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = Math.max(start + 1, end - overlapWords);
  }
  return pieces;
}

function getLastWords(text: string, wordCount: number) {
  if (!wordCount) return "";
  return text.split(/\s+/).slice(-wordCount).join(" ");
}
