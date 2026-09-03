import { absoluteUrl, plainText, postDescription, postHeadline, siteUrl } from "@/lib/seo";
import { languageHref } from "@/lib/visitor-language";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const language = new URL(request.url).searchParams.get("lang") === "tr" ? "tr" : "en";
  const [settings, posts] = await Promise.all([getSiteSettings(), getPosts(1, 50, language)]);
  const baseUrl = siteUrl(settings.domain);
  const feedUrl = absoluteUrl(baseUrl, languageHref("/feed.xml", language));
  const homeUrl = absoluteUrl(baseUrl, languageHref("/", language));
  const description = language === "tr" ? settings.description : settings.descriptionEn;
  const items = posts.filter((post) => post.status === "published").map((post) => {
    const link = absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, language));
    const publishedAt = post.published_at ?? post.created_at;
    return [
      "<item>",
      `<title>${xml(plainText(postHeadline(post)))}</title>`,
      `<description>${xml(plainText(postDescription(post)))}</description>`,
      `<link>${xml(link)}</link>`,
      `<guid isPermaLink="true">${xml(link)}</guid>`,
      `<pubDate>${new Date(publishedAt).toUTCString()}</pubDate>`,
      post.cover_path ? `<media:content url="${xml(post.cover_path)}" medium="image" />` : "",
      "</item>",
    ].filter(Boolean).join("");
  }).join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${xml(settings.siteName)}</title><description>${xml(description)}</description><link>${xml(homeUrl)}</link><language>${language}</language><atom:link href="${xml(feedUrl)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600" } });
}
