import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type SiteSettings = {
  siteName: string;
  domain: string;
  language: "tr" | "en";
  description: string;
  descriptionEn: string;
  homeTitle: string;
  feedLayout: "short" | "card" | "classic";
  postsPerPage: number;
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  showSubscriberCount: boolean;
  contactEmail: string;
  maintenanceMode: boolean;
  updatedAt: string | null;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "diji.news",
  domain: "diji.news",
  language: "tr",
  description: "Teknoloji, yapay zekâ, bilim ve dijital kültür yoğunluklu kısa ve güncel paylaşımlar.",
  descriptionEn: "Concise and current notes focused on technology, artificial intelligence, science, and digital culture.",
  homeTitle: "Kısa ve özgün teknoloji notları",
  feedLayout: "short",
  postsPerPage: 7,
  newsletterEnabled: true,
  newsletterTitle: "Haftalık bülten",
  newsletterDescription: "Haftanın kısa teknoloji notları, tek e-postada.",
  showSubscriberCount: true,
  contactEmail: "merhaba@diji.news",
  maintenanceMode: false,
  updatedAt: null,
};

const settingKeys = {
  diji_site_name: "siteName",
  diji_domain: "domain",
  diji_language: "language",
  diji_description: "description",
  diji_description_en: "descriptionEn",
  home_intro_text: "description",
  home_title: "homeTitle",
  diji_feed_layout: "feedLayout",
  home_posts_per_page: "postsPerPage",
  newsletter_enabled: "newsletterEnabled",
  newsletter_title: "newsletterTitle",
  newsletter_description: "newsletterDescription",
  show_subscriber_count: "showSubscriberCount",
  contact_email: "contactEmail",
  maintenance_mode: "maintenanceMode",
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
