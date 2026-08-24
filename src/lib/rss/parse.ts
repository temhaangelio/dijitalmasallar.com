/**
 * A tolerant RSS 2.0 / Atom / RDF reader.
 *
 * Hand-rolled rather than pulled from npm for the same reason the markdown preview is: the shapes
 * actually in use are small, and a parser that never throws is worth more here than a complete one.
 * Anything it cannot understand comes back as an empty string, so one malformed feed can never take
 * down the refresh of the others.
 *
 * Namespace prefixes are matched loosely — `<dc:creator>`, `<content:encoded>` and their
 * unprefixed forms all resolve through the same lookup.
 */

export type ParsedFeedItem = {
  guid: string;
  title: string;
  link: string;
  summary: string;
  author: string;
  publishedAt: string | null;
};

export type ParsedFeed = {
  title: string;
  siteUrl: string;
  items: ParsedFeedItem[];
};

/** Feeds routinely carry hundreds of entries; only the newest are worth storing on each pass. */
const itemsPerFetch = 120;
const summaryLength = 400;

const namedEntities: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", laquo: "«", raquo: "»",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", middot: "·", eacute: "é",
};

function codePoint(value: number) {
  // Surrogates and out-of-range values would throw; a feed is never worth a crash.
  if (!Number.isFinite(value) || value <= 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) return "";
  return String.fromCodePoint(value);
}

/** One pass, so an encoded `&amp;lt;` stays the literal text `&lt;` instead of decoding twice. */
function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, reference: string) => {
    if (reference.startsWith("#x") || reference.startsWith("#X")) return codePoint(Number.parseInt(reference.slice(2), 16)) || whole;
    if (reference.startsWith("#")) return codePoint(Number.parseInt(reference.slice(1), 10)) || whole;
    return namedEntities[reference.toLowerCase()] ?? whole;
  });
}

function unwrapCdata(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

/**
 * Feed text fields hold *escaped* HTML: `<description>` routinely carries `&lt;p&gt;…&lt;/p&gt;`.
 * So the entities are decoded first to recover the markup, the markup is dropped, and what the
 * markup itself escaped (`&amp;` inside the HTML) is decoded on the second pass.
 *
 * The tag pattern insists on a letter after the angle bracket, so prose like "3 < 5 and 7 > 2"
 * survives instead of having its middle swallowed as if it were an element.
 */
function toPlainText(value: string) {
  const markup = decodeEntities(unwrapCdata(value));
  const stripped = markup
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?[a-z][\w:-]*(?:\s[^<>]*)?\/?>/gi, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

function tagContent(block: string, ...names: string[]) {
  for (const name of names) {
    const pattern = new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}\\s*>`, "i");
    const match = pattern.exec(block);
    if (match) return match[1];
  }
  return "";
}

function attribute(tag: string, name: string) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(tag);
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? "") : "";
}

/** Both an absolute URL and a site-relative path are valid here; `absolute()` resolves the rest. */
function isLinkLike(value: string) {
  return /^https?:\/\//i.test(value) || /^\.{0,2}\//.test(value);
}

/**
 * RSS puts the target in the element's text; Atom puts it in a `href` attribute and may list
 * several, so the `alternate` relation wins and `self` / `hub` links are skipped.
 */
function linkOf(block: string) {
  const text = toPlainText(tagContent(block, "link"));
  if (isLinkLike(text)) return text;

  const tags = [...block.matchAll(/<(?:[\w-]+:)?link\b([^>]*?)\/?>/gi)].map((match) => match[1]);
  const relationOf = (tag: string) => attribute(tag, "rel").toLowerCase();
  const preferred =
    tags.find((tag) => relationOf(tag) === "alternate") ??
    tags.find((tag) => relationOf(tag) === "") ??
    tags.find((tag) => !["self", "hub", "replies", "edit"].includes(relationOf(tag)));
  const href = preferred ? attribute(preferred, "href") : "";
  return isLinkLike(href) ? href : "";
}

function authorOf(block: string) {
  const raw = tagContent(block, "creator", "author", "publisher");
  if (!raw) return "";
  // Atom nests the display name: <author><name>…</name></author>.
  const name = tagContent(raw, "name");
  return toPlainText(name || raw).slice(0, 120);
}

function publishedAtOf(block: string) {
  for (const name of ["pubDate", "published", "date", "updated", "modified"]) {
    const raw = toPlainText(tagContent(block, name));
    if (!raw) continue;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function summaryOf(block: string) {
  const raw = tagContent(block, "description", "summary", "encoded", "content", "subtitle");
  const text = toPlainText(raw);
  return text.length > summaryLength ? `${text.slice(0, summaryLength - 1).trimEnd()}…` : text;
}

/** Resolves a feed's relative link against the feed URL, so `/article/1` still opens. */
function absolute(link: string, feedUrl: string) {
  if (!link) return "";
  try {
    return new URL(link, feedUrl).toString();
  } catch {
    return "";
  }
}

/**
 * Finds the feeds an HTML page advertises in its head:
 *
 *   <link rel="alternate" type="application/rss+xml" href="/feed.xml">
 *
 * Most sites that look like they have no RSS address do have one — it is just never shown to the
 * reader. Pasting the site's own URL is enough when this finds it.
 *
 * Ordered so a full feed wins over a comments-only one, which WordPress advertises alongside it and
 * which is almost never what someone means to follow.
 */
export function discoverFeedUrls(html: string, pageUrl: string): string[] {
  const found: { url: string; comments: boolean }[] = [];

  for (const [, attributes] of html.matchAll(/<link\b([^>]*)>/gi)) {
    const relation = attribute(attributes, "rel").toLowerCase();
    const type = attribute(attributes, "type").toLowerCase();
    if (!relation.split(/\s+/).includes("alternate")) continue;
    if (!/^application\/(rss|atom)\+xml$/.test(type)) continue;

    const url = absolute(attribute(attributes, "href"), pageUrl);
    if (!url || found.some((entry) => entry.url === url)) continue;
    const title = attribute(attributes, "title").toLowerCase();
    found.push({ url, comments: /comment|yorum/.test(`${title} ${url}`) });
  }

  return [...found.filter((entry) => !entry.comments), ...found.filter((entry) => entry.comments)].map((entry) => entry.url);
}

/*
 * Shared with the page scraper, which faces the same HTML and the same entity mess. Exported here
 * rather than copied there so the two can never disagree about what a title looks like.
 */
export { toPlainText as plainText, absolute as resolveUrl };

/** A page's own <title>, used to name a source that has no feed to name itself. */
export function pageTitle(html: string) {
  return toPlainText(tagContent(html, "title")).slice(0, 160);
}

export function parseFeed(xml: string, feedUrl: string): ParsedFeed {
  const blocks = [...xml.matchAll(/<(?:[\w-]+:)?(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:[\w-]+:)?\1\s*>/gi)];

  // Channel metadata is whatever is left once the entries are removed, so an entry's own <title>
  // cannot be mistaken for the feed's.
  const header = blocks.reduce((rest, block) => rest.replace(block[0], ""), xml);
  const title = toPlainText(tagContent(header, "title")).slice(0, 160);
  const siteUrl = absolute(linkOf(header), feedUrl);

  const items: ParsedFeedItem[] = [];
  const seen = new Set<string>();
  for (const block of blocks.slice(0, itemsPerFetch)) {
    const body = block[2];
    const link = absolute(linkOf(body), feedUrl);
    const itemTitle = toPlainText(tagContent(body, "title")).slice(0, 300);
    const summary = summaryOf(body);
    // `isPermaLink="false"` guids are opaque strings, which is exactly what is wanted for identity.
    const guid = (toPlainText(tagContent(body, "guid", "id")) || link || itemTitle).slice(0, 400);
    if (!guid || seen.has(guid)) continue;
    if (!itemTitle && !summary) continue;
    seen.add(guid);
    items.push({
      guid,
      title: itemTitle || summary.slice(0, 120),
      link,
      summary,
      author: authorOf(body),
      publishedAt: publishedAtOf(body),
    });
  }

  return { title, siteUrl, items };
}
