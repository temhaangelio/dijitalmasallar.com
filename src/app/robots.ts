import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const privatePaths = [
  "/admin",
  "/dashboard",
  "/yazilar",
  "/gunun-ozeti",
  "/bulten",
  "/profil",
  "/yerel-asistan",
  "/reklamlar",
  "/istatistik",
  "/yapay-zeka",
  "/rss",
  "/giris",
  "/sifremi-unuttum",
  "/sifre-yenile",
  "/auth",
  "/favoriler",
  "/ebulten/cikis",
  "/api/",
];

/**
 * The crawlers that answer questions rather than list links.
 *
 * Named one by one and allowed on purpose. Several of them — Google-Extended and
 * Applebot-Extended above all — are consulted *only* as an opt-in: a site that never mentions them
 * is treated by some of these products as withheld, so silence here would quietly keep the notes out
 * of the answers people now ask for instead of searching.
 */
const answerEngines = [
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Amazonbot",
  "meta-externalagent",
  "cohere-ai",
  "DuckAssistBot",
  "YouBot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();
  const publicRules = { allow: "/", disallow: privatePaths };
  return {
    rules: [
      { userAgent: "*", ...publicRules },
      { userAgent: answerEngines, ...publicRules },
    ],
    // The news sitemap is listed alongside the full one: Google News reads the first, everything
    // else reads the second, and neither has to guess the other's address.
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
    host: baseUrl,
  };
}
