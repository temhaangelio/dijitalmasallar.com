// A relative import rather than the `@/` alias: this module is unit-tested by Node's test runner,
// which resolves neither tsconfig paths nor extensionless specifiers.
import { type ParsedFeed, type ParsedFeedItem, pageTitle, plainText, resolveUrl } from "./parse.ts";

/**
 * Builds a feed out of a page that does not publish one.
 *
 * The idea is that an index page repeats itself: a news listing is a set of links that share a URL
 * shape and each carry a sentence or two of text, sitting among navigation links that share neither
 * property. So instead of asking anyone to write a CSS selector per site, the links are grouped by
 * shape and the group that reads like a list of articles wins.
 *
 * This is inherently less reliable than a real feed — it infers structure the publisher never
 * promised, and a redesign can change the answer. It is the fallback, offered only once no feed can
 * be found.
 */

/** Below this a group is more likely a footer or a language switcher than a list of stories. */
const minimumGroupSize = 3;
const minimumTitleLength = 15;
const maximumItems = 60;

/** Paths that are structural on nearly every site, and never the article list. */
const ignoredSegments = new Set([
  "tag", "tags", "category", "categories", "author", "authors", "page", "search",
  "login", "signin", "signup", "register", "account", "cart", "privacy", "terms",
  "legal", "cookie", "cookies", "contact", "about", "careers", "jobs", "rss", "feed",
]);

type Candidate = { url: string; shape: string; title: string };

/**
 * `/news/claude-opus-5` and `/news/some-other-post` share the shape `news:2`, while `/pricing`
 * (`pricing:1`) and `/` do not join them.
 */
function shapeOf(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return null;
  if (ignoredSegments.has(segments[0].toLowerCase())) return null;
  // A bare `/pricing` is a destination, not an entry in a list.
  if (segments.length < 2) return null;
  return `${segments[0].toLowerCase()}:${segments.length}`;
}

/** "Jul 21, 2026", "21 July 2026", "2026-07-21", "21.07.2026" — a card's date line, never its title. */
const datePattern = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|(?:\d{1,2}\s+)?[A-Za-zÇĞİÖŞÜçğıöşü]{3,12}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]{3,12}\s+\d{4})$/;

/**
 * A card is usually a date, a category and a headline stacked in one link, so the link's whole text
 * reads as "Jul 21, 2026 Announcements Anthropic is donating…". Taking the first block of text that
 * is long enough to be a sentence and is not a date skips the chrome and lands on the headline —
 * the excerpt that often follows is longer, which is why this takes the first match rather than the
 * longest.
 */
function firstHeadline(inner: string) {
  for (const segment of inner.split(/<[^>]+>/)) {
    const text = plainText(segment);
    if (text.length < minimumTitleLength) continue;
    if (datePattern.test(text)) continue;
    return text;
  }
  return "";
}

/** A heading inside the link is the publisher naming the story; everything else is inference. */
function titleOf(inner: string) {
  const heading = /<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]\s*>/i.exec(inner);
  if (heading) {
    const text = plainText(heading[1]);
    if (text.length >= minimumTitleLength) return text;
  }
  return firstHeadline(inner);
}

function attributeTitle(attributes: string) {
  const match = /\b(?:aria-label|title)\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attributes);
  return match ? plainText(match[1] ?? match[2] ?? "") : "";
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function scrapePage(html: string, pageUrl: string): ParsedFeed {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return { title: "", siteUrl: "", items: [] };
  }

  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  for (const [, attributes, inner] of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attributes);
    const raw = href?.[1] ?? href?.[2];
    if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) continue;

    const url = resolveUrl(raw, pageUrl);
    if (!url || !url.startsWith(origin)) continue;

    const target = new URL(url);
    target.hash = "";
    const clean = target.toString();
    if (clean === pageUrl || seen.has(clean)) continue;

    const shape = shapeOf(target.pathname);
    if (!shape) continue;

    // The heading wins; the link's whole text is the fallback and is often title + date + excerpt.
    const title = titleOf(inner) || attributeTitle(attributes) || plainText(inner);
    if (title.length < minimumTitleLength) continue;

    seen.add(clean);
    candidates.push({ url: clean, shape, title: title.slice(0, 300) });
  }

  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const group = groups.get(candidate.shape) ?? [];
    group.push(candidate);
    groups.set(candidate.shape, group);
  }

  let best: Candidate[] = [];
  let bestScore = 0;
  for (const group of groups.values()) {
    if (group.length < minimumGroupSize) continue;
    // Size says "this repeats"; title length says "these are stories, not menu entries". A long
    // list of two-word links scores below a short list of real headlines.
    const score = group.length * Math.min(median(group.map((entry) => entry.title.length)), 120);
    if (score > bestScore) {
      bestScore = score;
      best = group;
    }
  }

  const items: ParsedFeedItem[] = best.slice(0, maximumItems).map((candidate) => ({
    // The link is the identity: a scraped page offers no guid, and the URL is what makes an entry
    // the same entry on the next pass.
    guid: candidate.url,
    title: candidate.title,
    link: candidate.url,
    summary: "",
    author: "",
    // A listing rarely carries a machine-readable date, and a guessed one would sort the feed
    // wrongly. Left null, the item is ordered by when it was first seen.
    publishedAt: null,
  }));

  return { title: pageTitle(html), siteUrl: pageUrl, items };
}
