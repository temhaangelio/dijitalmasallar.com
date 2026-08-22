"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { postSchema } from "@/lib/validations/post";
import { getPostsPage, type PostSort } from "@/services/posts";

const postSorts: PostSort[] = ["newest", "oldest", "title-asc", "title-desc", "category-asc"];

export async function loadMorePostsAction(page: number, pageSize = 20, language: "tr" | "en" = "tr", sort: PostSort = "newest") {
  const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
  const safePageSize = Number.isInteger(pageSize) ? Math.min(Math.max(pageSize, 1), 50) : 20;
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false as const, message: "Bu işlem için yönetici yetkisi gerekir." };

  try {
    const safeSort = postSorts.includes(sort) ? sort : "newest";
    const result = await getPostsPage(safePage, safePageSize, language, safeSort);
    return { success: true as const, ...result };
  } catch {
    return { success: false as const, message: "Yazılar yüklenemedi. Lütfen tekrar deneyin." };
  }
}

export async function createPostAction(input: unknown) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Yazıyı kontrol edin." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const createdAt = parsed.data.status === "scheduled" ? new Date(parsed.data.scheduledAt!).toISOString() : new Date().toISOString();
  const { error } = await access.admin.from("posts").insert({
    content_tr: `# ${parsed.data.tr.title}\n\n${parsed.data.tr.excerpt}\n\n${parsed.data.tr.body}`,
    content_en: `# ${parsed.data.en.title}\n\n${parsed.data.en.excerpt}\n\n${parsed.data.en.body}`,
    category: parsed.data.category,
    source_name: parsed.data.sourceName,
    source_url: parsed.data.sourceUrl,
    show_title: parsed.data.showTitle,
    show_excerpt: parsed.data.showExcerpt,
    author_id: access.user.id,
    created_at: createdAt,
  });
  if (error) return { success: false, message: "Yazı kaydedilemedi. Lütfen tekrar deneyin." };
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath("/dashboard");
  return { success: true, message: "Yazı kaydedildi." };
}

export async function updatePostAction(id: string, input: unknown) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(id)) return { success: false, message: "Geçersiz yazı bilgisi." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data: current } = await access.admin.from("posts").select("id,created_at").or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
  if (!current) return { success: false, message: "Yazı bulunamadı." };
  const wasScheduled = new Date(current.created_at).getTime() > Date.now();
  const createdAt = parsed.data.status === "scheduled" ? new Date(parsed.data.scheduledAt!).toISOString() : wasScheduled ? new Date().toISOString() : current.created_at;
  const { error } = await access.admin.from("posts").update({
    content_tr: `# ${parsed.data.tr.title}\n\n${parsed.data.tr.excerpt}\n\n${parsed.data.tr.body}`,
    content_en: `# ${parsed.data.en.title}\n\n${parsed.data.en.excerpt}\n\n${parsed.data.en.body}`,
    category: parsed.data.category,
    source_name: parsed.data.sourceName,
    source_url: parsed.data.sourceUrl,
    show_title: parsed.data.showTitle,
    show_excerpt: parsed.data.showExcerpt,
    created_at: createdAt,
  }).eq("id", current.id);
  if (error) return { success: false, message: "Yazı güncellenemedi." };
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath(`/yazilar/${id}/duzenle`); revalidatePath("/dashboard");
  return { success: true, message: "Yazı güncellendi." };
}

export async function deletePostAction(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { success: false, message: "Geçersiz yazı." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data: current } = await access.admin.from("posts").select("id").or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
  if (!current) return { success: false, message: "Yazı bulunamadı." };
  const { error } = await access.admin.from("posts").delete().eq("id", current.id);
  if (error) return { success: false, message: "Yazı silinemedi." };
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath("/dashboard"); return { success: true, message: "Yazı silindi." };
}
