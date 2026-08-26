/**
 * A sitemap read as if it were a feed.
 *
 * Most newsrooms that publish no RSS still publish a sitemap, because search engines require one —
 * so between the two, a source with neither is rare. A sitemap carries no titles, only addresses
 * and modification dates, which is enough to notice that a story is new; the headline is read from
 * the story page afterwards.
 */

export type SitemapEntry = { url: string; lastModified: string | null };

function tagValues(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi"))].map((match) => match[1]);
}

function firstTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
}

export function isSitemapIndex(xml: string) {
  return /<sitemapindex[\s>]/i.test(xml);
}

/**
 * A sitemap index points at other sitemaps. Returning them newest-first matters: a large site
 * splits by month or by year, and only the most recent file can hold a story published today.
 */
export function parseSitemapIndex(xml: string): SitemapEntry[] {
  return tagValues(xml, "sitemap")
    .map((block) => ({ url: firstTag(block, "loc"), lastModified: firstTag(block, "lastmod") || null }))
    .filter((entry) => entry.url)
    .sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}

export function parseSitemap(xml: string): SitemapEntry[] {
  return tagValues(xml, "url")
    .map((block) => ({
      url: firstTag(block, "loc"),
      // `news:publication_date` is the accurate one where a news sitemap provides it; `lastmod`
      // moves when a page is edited, which is not the same thing as being published.
      lastModified: firstTag(block, "news:publication_date") || firstTag(block, "lastmod") || null,
    }))
    .filter((entry) => entry.url)
    .sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}
