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
  updatedAt: string | null;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "dijitalmasallar.com",
  domain: "dijitalmasallar.com",
  language: "tr",
  description: "Teknoloji, yapay zekâ, bilim ve dijital kültür yoğunluklu kısa ve güncel paylaşımlar.",
  descriptionEn: "Concise and current notes focused on technology, artificial intelligence, science, and digital culture.",
  aboutText: "Teknoloji, yapay zekâ, bilim ve dijital kültürdeki gelişmeleri gün boyu takip edip kısa notlara dönüştürüyoruz. Her not tek bir habere odaklanır ve kaynağına bağlantı verir. Amacımız, uzun okumalara vakit ayıramayanların gündemi birkaç dakikada yakalamasını sağlamak.",
  aboutTextEn: "We follow what happens in technology, artificial intelligence, science, and digital culture through the day and turn it into short notes. Each note covers a single story and links back to its source. The goal is to let you catch up on the day in a couple of minutes.",
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
  updatedAt: null,
};

/** Site identity and feature availability are deployment constants, not editable content. */
export async function getSiteSettings(): Promise<SiteSettings> {
  return defaultSiteSettings;
}
