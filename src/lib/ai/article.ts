import "server-only";

import { download } from "@/lib/net/remote";
import { pageTitle, plainText } from "@/lib/rss/parse";

/**
 * The readable text of a story page, for the summariser to work from.
 *
 * Feed summaries are often a single teaser sentence, and sitemap entries carry no text at all, so
 * the story itself has to be read. This is deliberately blunt — strip the furniture, prefer the
 * `<article>` or `<main>` region if the page marks one, and cut to a length worth paying for. A
 * summariser given a page's navigation alongside its body writes about the navigation.
 */

const articleAgent = "diji.news AI desk (+https://diji.news)";

/** Enough for a press release in full; past this, sources repeat themselves in boilerplate. */
const textLimit = 12_000;

function stripFurniture(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, " ");
}

function region(html: string) {
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article && plainText(article[1]).length > 400) return article[1];
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main && plainText(main[1]).length > 400) return main[1];
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

/**
 * `<meta property="article:published_time">` and its siblings are how most publishers state a date
 * a sitemap could only approximate through `lastmod`.
 */
function publishedAt(html: string) {
  const patterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
    /<meta[^>]+name=["'](?:date|pubdate|publish-date)["'][^>]+content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const value = html.match(pattern)?.[1];
    if (value && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  }
  return null;
}

function metaTitle(html: string) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og) return plainText(og);
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (heading) return plainText(heading);
  return pageTitle(html);
}

export type ArticleText = {
  title: string;
  text: string;
  publishedAt: string | null;
};

export async function readArticle(url: string): Promise<ArticleText | null> {
  const result = await download(url, { userAgent: articleAgent, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", timeoutMs: 20_000 });
  if (!result) return null;
  const html = result.body;
  const text = plainText(stripFurniture(region(html))).slice(0, textLimit);
  // A page that yields almost nothing is a paywall, a JavaScript shell, or a redirect notice —
  // none of which the summariser can do anything honest with.
  if (text.length < 200) return null;
  return { title: metaTitle(html).slice(0, 300), text, publishedAt: publishedAt(html) };
}
