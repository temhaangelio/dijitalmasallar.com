import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const privatePaths = [
  "/dashboard/",
  "/yazilar/",
  "/reklamlar/",
  "/istatistik/",
  "/ayarlar/",
  "/profil/",
  "/giris/",
  "/sifremi-unuttum/",
  "/sifre-yenile/",
  "/auth/",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: ["OAI-SearchBot", "ChatGPT-User", "GPTBot"], allow: "/", disallow: privatePaths },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
