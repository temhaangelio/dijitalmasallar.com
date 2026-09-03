import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const privatePaths = [
  "/admin",
  "/dashboard",
  "/yazilar",
  "/reklamlar",
  "/istatistik",
  "/yapay-zeka",
  "/rss",
  "/giris",
  "/sifremi-unuttum",
  "/sifre-yenile",
  "/auth",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();
  const publicRules = { allow: "/", disallow: privatePaths };
  return {
    rules: [
      { userAgent: "*", ...publicRules },
      { userAgent: ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "ClaudeBot", "PerplexityBot"], ...publicRules },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
