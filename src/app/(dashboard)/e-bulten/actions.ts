"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { newsletterSchema } from "@/lib/validations/newsletter";

export async function createNewsletterAction(input: unknown) {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, message: parsed.error.issues[0]?.message ?? "Bülten bilgilerini kontrol edin." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false as const, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data, error } = await access.admin.from("newsletter_campaigns").insert({
    subject: parsed.data.subject,
    preview_text: parsed.data.previewText,
    content: parsed.data.content,
    status: parsed.data.status,
    scheduled_at: parsed.data.status === "scheduled" ? new Date(parsed.data.scheduledAt!).toISOString() : null,
    created_by: access.user.id,
  }).select("id").single();
  if (error || !data) return { success: false as const, message: "Bülten kaydedilemedi. Lütfen tekrar deneyin." };
  revalidatePath("/e-bulten");
  return { success: true as const, message: parsed.data.status === "scheduled" ? "Bülten planlandı." : "Bülten taslak olarak kaydedildi.", id: data.id as string };
}
