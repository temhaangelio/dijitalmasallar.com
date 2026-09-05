/**
 * Posts are stored as a single markdown column per language. Title and excerpt are derived from it
 * at read time, which is why this parsing lives in a dependency-free module: it is the one piece of
 * post handling that is worth testing on its own.
 */

export type ParsedPostContent = { title: string; excerpt: string; body: string };
export type ParsedBilingualPaste = { tr: string; en: string; sourceUrl?: string };

const titleLimit = 110;
const excerptLimit = 180;

function cleanSourceUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === "utc" || normalizedKey.startsWith("utm_")) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return value;
  }
}

/** Splits the compact `TR: … EN: … [source](url)` format used by editorial drafts. */
export function parseBilingualPostPaste(value: string): ParsedBilingualPaste | null {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  const trMarker = normalized.match(/(?:^|\n)\s*TR:\s*/i);
  if (!trMarker || trMarker.index === undefined) return null;

  const trStart = trMarker.index + trMarker[0].length;
  const afterTr = normalized.slice(trStart);
  const enMarker = afterTr.match(/\bEN:\s*/i);
  if (!enMarker || enMarker.index === undefined) return null;

  const tr = afterTr.slice(0, enMarker.index).trim();
  let en = afterTr.slice(enMarker.index + enMarker[0].length).trim();
  const markdownSource = en.match(/\n*\s*\[[^\]]+\]\((https?:\/\/[^)\s]+)\)\s*(?:↗\s*)?$/i);
  const plainSource = markdownSource ? null : en.match(/\n*\s*(https?:\/\/[^\s↗]+)\s*(?:↗\s*)?$/i);
  const sourceMatch = markdownSource ?? plainSource;
  const sourceUrl = sourceMatch?.[1] ? cleanSourceUrl(sourceMatch[1]) : undefined;
  if (sourceMatch?.index !== undefined) en = en.slice(0, sourceMatch.index).trim();

  if (!tr || !en) return null;
  return { tr, en, ...(sourceUrl ? { sourceUrl } : {}) };
}

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

/** Finds the opening sentence without treating initialisms such as “U.S.” as sentence endings. */
function firstSentence(value: string) {
  const endings = value.matchAll(/[.!?](?:\s|$)/g);
  for (const ending of endings) {
    const punctuationIndex = ending.index;
    const candidate = value.slice(0, punctuationIndex + 1);
    if (ending[0][0] === "." && /(?:\b[A-Za-z]\.){2,}$/.test(candidate)) continue;
    return candidate.trim();
  }
  return value;
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
  const openingSentence = firstSentence(clean);
  return {
    title: truncate(openingSentence, titleLimit),
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
  const sentence = firstSentence(source);
  return truncate(sentence, limit);
}

/** Keep leading headings with the first paragraph when placing a cover between text blocks. */
export function splitAfterFirstParagraph(value: string): { first: string; rest: string } {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  const blocks = normalized.split(/\n[ \t]*\n+/);
  const firstParagraph = blocks.findIndex((block) => !/^#{1,6}\s+[^\n]+$/.test(block));
  const boundary = firstParagraph < 0 ? blocks.length : firstParagraph + 1;
  return { first: blocks.slice(0, boundary).join("\n\n"), rest: blocks.slice(boundary).join("\n\n") };
}
