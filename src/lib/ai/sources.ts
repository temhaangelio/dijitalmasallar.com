import "server-only";

import { download } from "@/lib/net/remote";
import { discoverFeedUrls, pageTitle, parseFeed, plainText } from "@/lib/rss/parse";
import { scrapePage } from "@/lib/rss/scrape";
import { isSitemapIndex, parseSitemap, parseSitemapIndex } from "@/lib/ai/sitemap";

/**
 * Reading a publisher that never agreed to be read.
 *
 * Not every official newsroom publishes a feed — Anthropic's does not, and neither do several
 * agency press rooms — so a source is resolved through four layers, in descending order of how much
 * the publisher promised us:
 *
 *   1. a real RSS/Atom feed, if the address is one or announces one;
 *   2. the sitemap, which almost everyone maintains for search engines even when they skip RSS;
 *   3. the listing page, read by `scrapePage`'s shape heuristic;
 *   4. nothing — the source is rejected at the point it is added, not silently at 3am.
 *
 * The layer is decided once, when the source is added, and stored. Re-deciding it on every run
 * would make a source's behaviour depend on which of its endpoints happened to be up that minute.
 */

export type SourceKind = "feed" | "sitemap" | "page";

export type CollectedItem = {
  url: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
};

export type ResolvedSource = {
  name: string;
  siteUrl: string;
  sourceUrl: string;
  kind: SourceKind;
  allowedHosts: string[];
  items: CollectedItem[];
};

const collectorAgent = "diji.news AI desk (+https://diji.news)";
const commonFeedPaths = ["/feed", "/rss.xml", "/rss", "/feed.xml", "/atom.xml", "/index.xml", "/news/rss.xml", "/blog/rss.xml"];
const commonSitemapPaths = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/news-sitemap.xml", "/sitemap-news.xml"];
const itemLimit = 40;

/** A sitemap lists every page a site has ever had; only recent entries can be today's news. */
const sitemapFreshnessDays = 14;

export const noSourceFoundMessage = "Bu adresten haber okunamadı: akış, site haritası ve sayfa taraması denendi.";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * The allow list a story link is later checked against. It is the source's own host plus its
 * `www.`/bare twin, and nothing else — a feed that syndicates another publisher's article is
 * exactly the case this exists to stop.
 */
function hostsFor(url: string) {
  const host = hostOf(url);
  return host ? [host, `www.${host}`] : [];
}

export function isAllowedStoryUrl(url: string, allowedHosts: string[]) {
  if (!allowedHosts.length) return true;
  const host = hostOf(url);
  return Boolean(host) && allowedHosts.some((allowed) => {
    const normalised = allowed.toLowerCase().replace(/^www\./, "");
    return host === normalised || host.endsWith(`.${normalised}`);
  });
}

function fromParsedFeed(items: { link: string; title: string; summary: string; publishedAt: string | null }[]): CollectedItem[] {
  return items
    .filter((item) => item.link)
    .slice(0, itemLimit)
    .map((item) => ({
      url: item.link,
      title: plainText(item.title).slice(0, 300),
      excerpt: plainText(item.summary).slice(0, 2000),
      publishedAt: item.publishedAt,
    }));
}

async function tryFeed(url: string, body?: string): Promise<ResolvedSource | null> {
  let html = body;
  if (html === undefined) {
    const result = await download(url, { userAgent: collectorAgent });
    html = result?.body;
  }
  if (!html) return null;

  const direct = parseFeed(html, url);
  if (direct.items.length) {
    return {
      name: direct.title || hostOf(url),
      siteUrl: direct.siteUrl || new URL(url).origin,
      sourceUrl: url,
      kind: "feed",
      allowedHosts: hostsFor(direct.siteUrl || url),
      items: fromParsedFeed(direct.items),
    };
  }

  const candidates = [...discoverFeedUrls(html, url), ...commonFeedPaths.map((path) => new URL(path, url).toString())];
  const seen = new Set([url]);
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const result = await download(candidate, { userAgent: collectorAgent, timeoutMs: 8_000 });
      if (!result) continue;
      const feed = parseFeed(result.body, candidate);
      if (!feed.items.length) continue;
      return {
        name: feed.title || pageTitle(html) || hostOf(url),
        siteUrl: feed.siteUrl || new URL(url).origin,
        sourceUrl: candidate,
        kind: "feed",
        allowedHosts: hostsFor(feed.siteUrl || url),
        items: fromParsedFeed(feed.items),
      };
    } catch {
      // A candidate that does not answer is simply not the feed. Keep trying the rest.
    }
  }
  return null;
}

/**
 * A sitemap entry is an address and a date, never a headline — so items come back with an empty
 * title, and the summariser reads the story page for the rest. Depth and recency do the filtering:
 * `/pricing` is one segment deep and its `lastmod` never moves, while `/news/2026/some-story` is
 * both deep and recently touched.
 */
function fromSitemap(entries: { url: string; lastModified: string | null }[], allowedHosts: string[]): CollectedItem[] {
  const cutoff = Date.now() - sitemapFreshnessDays * 24 * 60 * 60 * 1000;
  return entries
    .filter((entry) => {
      if (!isAllowedStoryUrl(entry.url, allowedHosts)) return false;
      try {
        if (new URL(entry.url).pathname.split("/").filter(Boolean).length < 2) return false;
      } catch {
        return false;
      }
      if (!entry.lastModified) return false;
      const at = Date.parse(entry.lastModified);
      return Number.isFinite(at) && at >= cutoff;
    })
    .slice(0, itemLimit)
    .map((entry) => ({ url: entry.url, title: "", excerpt: "", publishedAt: new Date(entry.lastModified!).toISOString() }));
}

async function readSitemapAt(url: string, allowedHosts: string[], depth = 0): Promise<CollectedItem[]> {
  const result = await download(url, { userAgent: collectorAgent, accept: "application/xml, text/xml;q=0.9, */*;q=0.5" });
  if (!result) return [];
  if (isSitemapIndex(result.body)) {
    // One level down only: an index of indexes is vanishingly rare, and following them without a
    // bound is how a collector ends up walking an entire site.
    if (depth > 0) return [];
    const children = parseSitemapIndex(result.body).slice(0, 3);
    const batches = await Promise.all(children.map((child) => readSitemapAt(child.url, allowedHosts, depth + 1).catch(() => [])));
    return batches.flat().sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).slice(0, itemLimit);
  }
  return fromSitemap(parseSitemap(result.body), allowedHosts);
}

/** `robots.txt` is where a site with an unconventional sitemap path says where it actually is. */
async function sitemapPathsFromRobots(origin: string) {
  try {
    const result = await download(new URL("/robots.txt", origin).toString(), { userAgent: collectorAgent, timeoutMs: 6_000, accept: "text/plain" });
    if (!result) return [];
    return [...result.body.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((match) => match[1]).slice(0, 3);
  } catch {
    return [];
  }
}

async function trySitemap(url: string): Promise<ResolvedSource | null> {
  const origin = new URL(url).origin;
  const allowedHosts = hostsFor(url);
  const candidates = [...await sitemapPathsFromRobots(origin), ...commonSitemapPaths.map((path) => new URL(path, origin).toString())];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const items = await readSitemapAt(candidate, allowedHosts);
      if (items.length) {
        return { name: hostOf(url), siteUrl: origin, sourceUrl: candidate, kind: "sitemap", allowedHosts, items };
      }
    } catch {
      // Same as feeds: a missing sitemap is a non-answer, not an error worth surfacing.
    }
  }
  return null;
}

async function tryPage(url: string, body?: string): Promise<ResolvedSource | null> {
  let html = body;
  if (html === undefined) {
    const result = await download(url, { userAgent: collectorAgent });
    html = result?.body;
  }
  if (!html) return null;
  const scraped = scrapePage(html, url);
  if (!scraped.items.length) return null;
  const allowedHosts = hostsFor(url);
  return {
    name: scraped.title || pageTitle(html) || hostOf(url),
    siteUrl: scraped.siteUrl || new URL(url).origin,
    sourceUrl: url,
    kind: "page",
    allowedHosts,
    items: fromParsedFeed(scraped.items).filter((item) => isAllowedStoryUrl(item.url, allowedHosts)),
  };
}

/**
 * Works out how a source can be read, and proves it by returning the stories it found. A source
 * that resolves to nothing is refused while the editor is still looking at the form.
 */
export async function resolveSource(url: string): Promise<ResolvedSource> {
  const landing = await download(url, { userAgent: collectorAgent }).catch(() => null);
  const body = landing?.body;

  const feed = await tryFeed(url, body).catch(() => null);
  if (feed) return feed;

  const sitemap = await trySitemap(url).catch(() => null);
  if (sitemap) return sitemap;

  const page = await tryPage(url, body).catch(() => null);
  if (page) return page;

  throw new Error(noSourceFoundMessage);
}

export type StoredSource = {
  sourceUrl: string;
  kind: SourceKind;
  allowedHosts: string[];
};

/** The scheduled read: the layer is already known, so exactly one strategy runs. */
export async function readSource(source: StoredSource): Promise<CollectedItem[]> {
  if (source.kind === "sitemap") {
    return readSitemapAt(source.sourceUrl, source.allowedHosts);
  }

  const result = await download(source.sourceUrl, { userAgent: collectorAgent });
  if (!result) return [];

  const items = source.kind === "feed"
    ? fromParsedFeed(parseFeed(result.body, source.sourceUrl).items)
    : fromParsedFeed(scrapePage(result.body, source.sourceUrl).items);

  return items.filter((item) => isAllowedStoryUrl(item.url, source.allowedHosts));
}
