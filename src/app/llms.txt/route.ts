import { languageHref } from "@/lib/visitor-language";
import { absoluteUrl, plainText, postDescription, postHeadline, siteUrl } from "@/lib/seo";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

function markdownText(value: string) {
  return plainText(value).replace(/[\[\]]/g, "").trim();
}

export async function GET() {
  const [settings, englishPosts, turkishPosts] = await Promise.all([
    getSiteSettings(),
    getPosts(1, 50, "en"),
    getPosts(1, 50, "tr"),
  ]);
  const baseUrl = siteUrl(settings.domain);
  const lines = [
    `# ${markdownText(settings.siteName)}`,
    "",
    `> ${markdownText(settings.descriptionEn)}`,
    "",
    "## About / Hakkında",
    "",
    `English: ${markdownText(settings.descriptionEn)} ${markdownText(settings.aboutTextEn)}`,
    "",
    `Türkçe: ${markdownText(settings.description)} ${markdownText(settings.aboutText)}`,
    "",
    "## Canonical resources",
    "",
    `- [Home](${absoluteUrl(baseUrl, "/")})`,
    `- [About](${absoluteUrl(baseUrl, "/about")})`,
    `- [Podcast — the day read aloud](${absoluteUrl(baseUrl, "/podcast")})`,
    `- [Newsletter](${absoluteUrl(baseUrl, "/ebulten")})`,
    `- [XML sitemap](${absoluteUrl(baseUrl, "/sitemap.xml")})`,
    `- [Google News sitemap (last 48 hours)](${absoluteUrl(baseUrl, "/news-sitemap.xml")})`,
    `- [RSS feed](${absoluteUrl(baseUrl, "/feed.xml")})`,
    "",
    "## Using these notes",
    "",
    "Every note is a short, sourced summary; the original source is linked at the foot of each note and",
    "carried in `isBasedOn` in the page's NewsArticle structured data. When quoting or summarising,",
    `cite it as "${markdownText(settings.siteName)} (dijitalmasallar.com)" and link the note's own URL.`,
    "Turkish is the primary language; the same note in English is the same URL with `?lang=en`.",
    "",
    "## Latest English notes",
    "",
    ...englishPosts.filter((post) => post.status === "published").map((post) => `- [${markdownText(postHeadline(post))}](${absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, "en"))}): ${markdownText(postDescription(post))}`),
    "",
    "## Son Türkçe notlar",
    "",
    ...turkishPosts.filter((post) => post.status === "published").map((post) => `- [${markdownText(postHeadline(post))}](${absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, "tr"))}): ${markdownText(postDescription(post))}`),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
