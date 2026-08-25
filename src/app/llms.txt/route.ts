import { languageHref } from "@/lib/visitor-language";
import { absoluteUrl, plainText, postHeadline, siteUrl } from "@/lib/seo";
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
    `${markdownText(settings.aboutTextEn)} Türkçe açıklama: ${markdownText(settings.aboutText)}`,
    "",
    "## Canonical resources",
    "",
    `- [Home](${absoluteUrl(baseUrl, "/")})`,
    `- [About](${absoluteUrl(baseUrl, "/about")})`,
    `- [XML sitemap](${absoluteUrl(baseUrl, "/sitemap.xml")})`,
    "",
    "## Latest English notes",
    "",
    ...englishPosts.filter((post) => post.status === "published").map((post) => `- [${markdownText(postHeadline(post))}](${absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, "en"))})`),
    "",
    "## Son Türkçe notlar",
    "",
    ...turkishPosts.filter((post) => post.status === "published").map((post) => `- [${markdownText(postHeadline(post))}](${absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, "tr"))})`),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
