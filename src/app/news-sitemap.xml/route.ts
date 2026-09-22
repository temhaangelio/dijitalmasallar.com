import { languageHref } from "@/lib/visitor-language";
import { absoluteUrl, postHeadline, siteUrl } from "@/lib/seo";
import { getBriefPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

/**
 * The Google News sitemap.
 *
 * A separate file from `sitemap.xml` because it answers a different question: not "what exists" but
 * "what is new", and Google News only reads the last two days from it — anything older is dropped by
 * them, so it is dropped here too rather than sent and ignored. Each note appears twice, once per
 * language, because each language is its own URL with its own headline.
 */
export const dynamic = "force-dynamic";

/** Google News ignores anything older than this, so the window is theirs, not ours. */
const windowHours = 48;

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const settings = await getSiteSettings();
  const baseUrl = siteUrl(settings.domain);
  const now = new Date();
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000).toISOString();

  const [turkish, english] = await Promise.all([
    getBriefPosts(since, now.toISOString(), "tr"),
    getBriefPosts(since, now.toISOString(), "en"),
  ]);

  const entries = [
    ...turkish.map((post) => ({ post, language: "tr" as const })),
    ...english.map((post) => ({ post, language: "en" as const })),
  ].filter(({ post }) => post.status === "published");

  const urls = entries.map(({ post, language }) => {
    const url = absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, language));
    const published = post.published_at ?? post.created_at;
    return `  <url>
    <loc>${xml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xml(settings.siteName)}</news:name>
        <news:language>${language}</news:language>
      </news:publication>
      <news:publication_date>${xml(new Date(published).toISOString())}</news:publication_date>
      <news:title>${xml(postHeadline(post))}</news:title>
    </news:news>${post.cover_path ? `
    <image:image><image:loc>${xml(post.cover_path)}</image:loc></image:image>` : ""}
  </url>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
