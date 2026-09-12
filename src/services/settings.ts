import "server-only";

export type SiteSettings = {
  siteName: string;
  domain: string;
  language: "tr" | "en";
  description: string;
  descriptionEn: string;
  aboutText: string;
  aboutTextEn: string;
  homeTitle: string;
  feedLayout: "short" | "card" | "classic";
  postsPerPage: number;
  contactEmail: string;
  maintenanceMode: boolean;
  modulePosts: boolean;
  moduleRss: boolean;
  moduleAds: boolean;
  moduleAnalytics: boolean;
  modulePush: boolean;
  moduleNewsletter: boolean;
  updatedAt: string | null;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "Dijital Masallar",
  domain: "dijitalmasallar.com",
  language: "tr",
  description: "Teknoloji, yapay zekâ, bilim ve dijital kültürden kısa notlar.",
  descriptionEn: "Short notes from technology, artificial intelligence, science, and digital culture.",
  aboutText: "Teknoloji, yapay zekâ, bilim ve dijital kültür gündemini yapay zekâ yalnızca resmî kaynaklardan buluyor, özetliyor ve kısa haber notlarına dönüştürüyor. Clickbait yok; sade tasarım, kolay okuma ve az reklamla gündemi hızlıca takip edebilirsiniz.",
  aboutTextEn: "AI follows the technology, artificial intelligence, science and digital culture agenda using official sources only, summarises it and turns it into short news notes. No clickbait: a plain design, easy reading and few ads let you catch up on the day quickly.",
  homeTitle: "Kısa ve özgün teknoloji notları",
  feedLayout: "short",
  postsPerPage: 7,
  contactEmail: "temhaangelio@gmail.com",
  maintenanceMode: false,
  modulePosts: true,
  moduleRss: true,
  moduleAds: true,
  moduleAnalytics: true,
  modulePush: true,
  moduleNewsletter: true,
  updatedAt: null,
};

/** Site identity and feature availability are deployment constants, not editable content. */
export async function getSiteSettings(): Promise<SiteSettings> {
  return defaultSiteSettings;
}
