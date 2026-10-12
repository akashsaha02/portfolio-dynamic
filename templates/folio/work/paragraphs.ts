// Splits a long case-study field into a few paragraphs at sentence ends, so a 1,000-character
// "How it works" doesn't sit as one wall of text (guide §4.4 "short paragraphs"). The wording is
// untouched: sentences are only grouped, in order, into up to `max` paragraphs of roughly equal
// length. Text shorter than `minLength` stays one paragraph.

// A sentence ends at . ! or ? followed by whitespace and a capital letter or digit, which leaves
// "Next.js", "e.g. foo" and "/api so" alone.
const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z0-9])/;

export function toParagraphs(text: string, { max = 3, minLength = 600 } = {}): string[] {
  const trimmed = text.trim();
  if (trimmed.length < minLength) return [trimmed];

  const sentences = trimmed.split(SENTENCE_END);
  const count = Math.min(max, Math.ceil(trimmed.length / 400), sentences.length);
  if (count < 2) return [trimmed];

  const share = trimmed.length / count;
  const paragraphs: string[] = [];
  let current: string[] = [];
  let consumed = 0;

  sentences.forEach((sentence, i) => {
    current.push(sentence);
    consumed += sentence.length + 1;
    const toCome = count - paragraphs.length - 1;
    // Close the paragraph once the text so far reaches its share, keeping at least one sentence
    // for each paragraph still to come.
    if (toCome > 0 && sentences.length - i - 1 >= toCome && consumed >= share * (paragraphs.length + 1)) {
      paragraphs.push(current.join(" "));
      current = [];
    }
  });
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs;
}
