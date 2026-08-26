import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

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
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterTitleEn: string;
  newsletterDescription: string;
  newsletterDescriptionEn: string;
  showSubscriberCount: boolean;
  contactEmail: string;
  maintenanceMode: boolean;
  modulePosts: boolean;
  moduleRss: boolean;
  moduleAi: boolean;
  moduleNewsletter: boolean;
  moduleAds: boolean;
  moduleAnalytics: boolean;
  modulePush: boolean;
  updatedAt: string | null;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "diji.news",
  domain: "diji.news",
  language: "tr",
  description: "Teknoloji, yapay zekâ, bilim ve dijital kültür yoğunluklu kısa ve güncel paylaşımlar.",
  descriptionEn: "Concise and current notes focused on technology, artificial intelligence, science, and digital culture.",
  aboutText: "Teknoloji, yapay zekâ, bilim ve dijital kültürdeki gelişmeleri gün boyu takip edip kısa notlara dönüştürüyoruz. Her not tek bir habere odaklanır ve kaynağına bağlantı verir. Amacımız, uzun okumalara vakit ayıramayanların gündemi birkaç dakikada yakalamasını sağlamak.",
  aboutTextEn: "We follow what happens in technology, artificial intelligence, science, and digital culture through the day and turn it into short notes. Each note covers a single story and links back to its source. The goal is to let you catch up on the day in a couple of minutes.",
  homeTitle: "Kısa ve özgün teknoloji notları",
  feedLayout: "short",
  postsPerPage: 7,
  newsletterEnabled: true,
  newsletterTitle: "Haftalık bülten",
  newsletterTitleEn: "Weekly newsletter",
  newsletterDescription: "Haftanın kısa teknoloji notları, tek e-postada.",
  newsletterDescriptionEn: "The week’s concise technology notes in one email.",
  showSubscriberCount: true,
  contactEmail: "merhaba@diji.news",
  maintenanceMode: false,
  modulePosts: true,
  moduleRss: true,
  moduleAi: true,
  moduleNewsletter: true,
  moduleAds: true,
  moduleAnalytics: true,
  modulePush: true,
  updatedAt: null,
};

const settingKeys = {
  diji_site_name: "siteName",
  diji_domain: "domain",
  diji_language: "language",
  diji_description: "description",
  diji_description_en: "descriptionEn",
  about_text: "aboutText",
  about_text_en: "aboutTextEn",
  home_intro_text: "description",
  home_title: "homeTitle",
  diji_feed_layout: "feedLayout",
  home_posts_per_page: "postsPerPage",
  newsletter_enabled: "newsletterEnabled",
  newsletter_title: "newsletterTitle",
  newsletter_title_en: "newsletterTitleEn",
  newsletter_description: "newsletterDescription",
  newsletter_description_en: "newsletterDescriptionEn",
  show_subscriber_count: "showSubscriberCount",
  contact_email: "contactEmail",
  maintenance_mode: "maintenanceMode",
  module_posts: "modulePosts",
  module_rss: "moduleRss",
  module_ai: "moduleAi",
  module_newsletter: "moduleNewsletter",
  module_ads: "moduleAds",
  module_analytics: "moduleAnalytics",
  module_push: "modulePush",
} as const;

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await createAdminClient().from("site_settings").select("key,value,updated_at");
    if (error) return defaultSiteSettings;
    const settings: SiteSettings = { ...defaultSiteSettings };
    let updatedAt: string | null = null;
    for (const row of data ?? []) {
      const property = settingKeys[row.key as keyof typeof settingKeys];
      if (property && row.value !== null && row.value !== undefined) Object.assign(settings, { [property]: row.value });
      if (row.updated_at && (!updatedAt || row.updated_at > updatedAt)) updatedAt = row.updated_at;
    }
    settings.postsPerPage = Math.min(Math.max(Number(settings.postsPerPage) || 7, 3), 20);
    settings.updatedAt = updatedAt;
    return settings;
  } catch {
    return defaultSiteSettings;
  }
});
