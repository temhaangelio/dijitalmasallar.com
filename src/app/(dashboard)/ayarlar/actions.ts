"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { settingsSchema } from "@/lib/validations/settings";

export async function saveSettingsAction(input: unknown) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Ayarları kontrol edin." };

  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };

  const entries = [
    ["diji_site_name", parsed.data.siteName],
    ["diji_domain", parsed.data.domain],
    ["diji_description", parsed.data.description],
    ["home_intro_text", parsed.data.description],
    ["diji_description_en", parsed.data.descriptionEn],
    ["diji_language", parsed.data.language],
    ["diji_feed_layout", parsed.data.feedLayout],
    ["home_posts_per_page", parsed.data.postsPerPage],
    ["newsletter_enabled", parsed.data.newsletterEnabled],
    ["newsletter_title", parsed.data.newsletterTitle],
    ["newsletter_description", parsed.data.newsletterDescription],
    ["show_subscriber_count", parsed.data.showSubscriberCount],
    ["contact_email", parsed.data.contactEmail],
    ["maintenance_mode", parsed.data.maintenanceMode],
  ].map(([key, value]) => ({ key, value }));
  const { error } = await access.admin.from("site_settings").upsert(entries, { onConflict: "key" });
  if (error) return { success: false, message: "Ayarlar kaydedilemedi." };

  revalidatePath("/ayarlar");
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: true, message: "Ayarlar kaydedildi." };
}
