import type { MetadataRoute } from "next";
import { languageHref } from "@/lib/visitor-language";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, englishPosts, turkishPosts] = await Promise.all([
    getSiteSettings(),
    getPosts(1, 500, "en"),
    getPosts(1, 500, "tr"),
  ]);
  const baseUrl = siteUrl(settings.domain);
  const staticPaths = ["/", "/about"];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path, index) => {
    const alternates = {
      en: absoluteUrl(baseUrl, languageHref(path, "en")),
      tr: absoluteUrl(baseUrl, languageHref(path, "tr")),
      "x-default": absoluteUrl(baseUrl, languageHref(path, "en")),
    };
    const shared = {
      lastModified: settings.updatedAt ?? undefined,
      changeFrequency: index === 0 ? "hourly" as const : "monthly" as const,
      priority: index === 0 ? 1 : 0.6,
      alternates: { languages: alternates },
    };
    return [{ url: alternates.en, ...shared }, { url: alternates.tr, ...shared }];
  });

  const byId = new Map(englishPosts.map((post) => [post.id, post]));
  for (const post of turkishPosts) if (!byId.has(post.id)) byId.set(post.id, post);
  const articleEntries: MetadataRoute.Sitemap = [...byId.values()]
    .filter((post) => post.status === "published")
    .flatMap((post) => {
      const path = `/haber/${post.id}`;
      const alternates = {
        en: absoluteUrl(baseUrl, languageHref(path, "en")),
        tr: absoluteUrl(baseUrl, languageHref(path, "tr")),
        "x-default": absoluteUrl(baseUrl, languageHref(path, "en")),
      };
      const shared = {
        lastModified: post.published_at ?? post.created_at,
        changeFrequency: "never" as const,
        priority: 0.8,
        alternates: { languages: alternates },
        images: post.cover_path ? [post.cover_path] : undefined,
      };
      return [
        { url: alternates.en, ...shared },
        { url: alternates.tr, ...shared },
      ];
    });

  return [...staticEntries, ...articleEntries];
}
