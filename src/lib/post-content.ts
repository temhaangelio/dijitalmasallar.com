/**
 * Posts are stored as a single markdown column per language. Title and excerpt are derived from it
 * at read time, which is why this parsing lives in a dependency-free module: it is the one piece of
 * post handling that is worth testing on its own.
 */

export type ParsedPostContent = { title: string; excerpt: string; body: string };

const titleLimit = 110;
const excerptLimit = 180;

export function stripMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/[*_`=]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 3).trimEnd()}…` : value;
}

/**
 * An authored post starts with `# Title`, a blank line, the excerpt, a blank line, then the body.
 * Anything else — imported notes, posts saved with the title/excerpt toggles off — falls back to
 * deriving a title from the first sentence.
 */
export function parsePostContent(value: string): ParsedPostContent {
  if (value.startsWith("# ")) {
    const [heading, excerpt = "", ...bodyParts] = value.split("\n\n");
    if (bodyParts.length) return { title: heading.slice(2).trim(), excerpt: excerpt.trim(), body: bodyParts.join("\n\n").trim() };
  }
  const clean = stripMarkdown(value);
  // Falling back to the whole string rather than a pre-sliced one lets `truncate` add the ellipsis;
  // slicing first produced a title cut mid-word with no indication that it had been shortened.
  const firstSentence = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || clean;
  return {
    title: truncate(firstSentence, titleLimit),
    excerpt: truncate(clean, excerptLimit),
    body: value,
  };
}

/**
 * The one-line gist of a note, for places that show a story without opening it — the daily brief on
 * the feed, and anywhere else a single sentence has to stand in for the whole note.
 *
 * The authored excerpt is preferred because an editor wrote it for exactly this purpose; notes
 * imported without one fall back to the opening sentence of the body. Either way only the first
 * sentence survives, so a brief cannot turn into a paragraph.
 */
export function summaryLine(post: { excerpt: string; body: string }, limit = 150) {
  const source = post.excerpt.trim() || stripMarkdown(post.body.replace(/^#\s+[^\n]+\n+/, ""));
  const sentence = source.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || source;
  return truncate(sentence, limit);
}
