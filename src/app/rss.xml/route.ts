import { getAppUrl } from "@/lib/env";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

const itemLimit = 50;

/** Escapes the five XML entities. Post titles and excerpts are plain text, never markup. */
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const language = resolveVisitorLanguage(new URL(request.url).searchParams.get("lang"));
  const [settings, posts] = await Promise.all([getSiteSettings(), getPosts(1, itemLimit, language)]);
  const appUrl = getAppUrl();
  const feedUrl = `${appUrl}${languageHref("/rss.xml", language)}`;
  const description = language === "en" ? settings.descriptionEn : settings.description;

  const items = posts
    .filter((post) => post.status === "published")
    .map((post) => {
      const link = `${appUrl}${languageHref(`/haber/${post.id}`, language)}`;
      const published = new Date(post.published_at ?? post.created_at).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${published}</pubDate>`,
        post.category ? `      <category>${escapeXml(post.category)}</category>` : null,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        "    </item>",
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.siteName)}</title>
    <link>${escapeXml(`${appUrl}${languageHref("/", language)}`)}</link>
    <description>${escapeXml(description)}</description>
    <language>${language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
