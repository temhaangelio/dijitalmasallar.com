"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/utils";
import { postSchema } from "@/lib/validations/post";
import { getPostsPage, type PostPublicationFilter, type PostSort } from "@/services/posts";
import { notifyNewPost } from "@/services/push";

const postSorts: PostSort[] = ["newest", "oldest", "title-asc", "title-desc", "category-asc"];
const postStatuses: PostPublicationFilter[] = ["all", "published", "scheduled"];
const acceptedImages = new Set(["image/jpeg", "image/png", "image/webp"]);

function storagePathFromUrl(value: string | null) {
  if (!value) return null;
  const marker = "/storage/v1/object/public/diji-post-media/";
  const index = value.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(value.slice(index + marker.length));
}

async function uploadCover(access: NonNullable<Awaited<ReturnType<typeof getAuthorizedAdminClient>>>, image: File | null) {
  if (!image || image.size === 0) return { url: null, path: null, error: null };
  if (!acceptedImages.has(image.type)) return { url: null, path: null, error: "Görsel JPG, PNG veya WebP olmalı." };
  if (image.size > 5 * 1024 * 1024) return { url: null, path: null, error: "Görsel 5 MB’dan küçük olmalı." };
  const extension = image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const path = `${access.user.id}/${randomUUID()}.${extension}`;
  const { error } = await access.admin.storage.from("diji-post-media").upload(path, image, { contentType: image.type, upsert: false });
  if (error) return { url: null, path: null, error: "Kapak görseli yüklenemedi." };
  return { url: access.admin.storage.from("diji-post-media").getPublicUrl(path).data.publicUrl, path, error: null };
}

export async function loadMorePostsAction(page: number, pageSize = 20, language: "tr" | "en" = "tr", sort: PostSort = "newest", search = "", status: PostPublicationFilter = "all") {
  const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
  const safePageSize = Number.isInteger(pageSize) ? Math.min(Math.max(pageSize, 1), 50) : 20;
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false as const, message: "Bu işlem için yönetici yetkisi gerekir." };

  try {
    const safeSort = postSorts.includes(sort) ? sort : "newest";
    const safeStatus = postStatuses.includes(status) ? status : "all";
    const result = await getPostsPage(safePage, safePageSize, language, safeSort, String(search).slice(0, 120), safeStatus);
    return { success: true as const, ...result };
  } catch {
    return { success: false as const, message: "Yazılar yüklenemedi. Lütfen tekrar deneyin." };
  }
}

/**
 * Push goes out after the response, through `after`, so the editor's save is never held up by a
 * thousand endpoints — and a push service having a bad day cannot turn a saved note into an error.
 */
function notifyPublishedPost(id: string, data: { tr: { title: string; excerpt: string }; en: { title: string; excerpt: string } }) {
  after(async () => {
    try {
      await notifyNewPost({ id, tr: data.tr, en: data.en });
    } catch (error) {
      console.error("Push notification for new post failed", error);
    }
  });
}

export async function createPostAction(input: unknown, image: File | null = null) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Yazıyı kontrol edin." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const cover = await uploadCover(access, image);
  if (cover.error) return { success: false, message: cover.error };
  const createdAt = parsed.data.status === "scheduled" ? new Date(parsed.data.scheduledAt!).toISOString() : new Date().toISOString();
  const { data: created, error } = await access.admin.from("posts").insert({
    content_tr: `# ${parsed.data.tr.title}\n\n${parsed.data.tr.excerpt}\n\n${parsed.data.tr.body}`,
    content_en: `# ${parsed.data.en.title}\n\n${parsed.data.en.excerpt}\n\n${parsed.data.en.body}`,
    category: parsed.data.category,
    source_name: parsed.data.sourceName,
    source_url: parsed.data.sourceUrl,
    cover_path: cover.url,
    show_title: parsed.data.showTitle,
    show_excerpt: parsed.data.showExcerpt,
    author_id: access.user.id,
    created_at: createdAt,
  }).select("id").single();
  if (error) {
    if (cover.path) await access.admin.storage.from("diji-post-media").remove([cover.path]);
    // Database hints name columns and constraints, so they stay in the server log.
    console.error("Supabase post insert failed", { code: error.code, message: error.message });
    return { success: false, message: "Yazı kaydedilemedi. Lütfen tekrar deneyin." };
  }
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath("/dashboard");
  // A note that is live right now is the only kind that can announce itself here: a scheduled one
  // becomes visible on its own timestamp, with no request to hang the send off.
  if (created?.id && parsed.data.status !== "scheduled") notifyPublishedPost(created.id, parsed.data);
  return { success: true, message: "Yazı kaydedildi." };
}

export async function updatePostAction(id: string, input: unknown, image: File | null = null, removeCover = false) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success || !isUuid(id)) return { success: false, message: "Geçersiz yazı bilgisi." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data: current } = await access.admin.from("posts").select("id,created_at,cover_path").or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
  if (!current) return { success: false, message: "Yazı bulunamadı." };
  const wasScheduled = new Date(current.created_at).getTime() > Date.now();
  const cover = await uploadCover(access, image);
  if (cover.error) return { success: false, message: cover.error };
  const createdAt = parsed.data.status === "scheduled"
    ? new Date(parsed.data.scheduledAt!).toISOString()
    : parsed.data.publishedAt
      ? new Date(parsed.data.publishedAt).toISOString()
      : wasScheduled
        ? new Date().toISOString()
        : current.created_at;
  const { error } = await access.admin.from("posts").update({
    content_tr: `# ${parsed.data.tr.title}\n\n${parsed.data.tr.excerpt}\n\n${parsed.data.tr.body}`,
    content_en: `# ${parsed.data.en.title}\n\n${parsed.data.en.excerpt}\n\n${parsed.data.en.body}`,
    category: parsed.data.category,
    source_name: parsed.data.sourceName,
    source_url: parsed.data.sourceUrl,
    cover_path: cover.url ?? (removeCover ? null : current.cover_path),
    show_title: parsed.data.showTitle,
    show_excerpt: parsed.data.showExcerpt,
    created_at: createdAt,
  }).eq("id", current.id);
  if (error) {
    if (cover.path) await access.admin.storage.from("diji-post-media").remove([cover.path]);
    console.error("Supabase post update failed", { code: error.code, message: error.message });
    return { success: false, message: "Yazı güncellenemedi. Lütfen tekrar deneyin." };
  }
  if ((cover.url || removeCover) && current.cover_path) {
    const oldPath = storagePathFromUrl(current.cover_path);
    if (oldPath) await access.admin.storage.from("diji-post-media").remove([oldPath]);
  }
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath(`/yazilar/${id}/duzenle`); revalidatePath("/dashboard");
  // Only the moment a scheduled note is pulled forward counts as publishing it; ordinary edits to an
  // already-published note must not notify the same readers again.
  if (wasScheduled && parsed.data.status !== "scheduled") notifyPublishedPost(current.id, parsed.data);
  return { success: true, message: "Yazı güncellendi." };
}

export async function deletePostAction(id: string) {
  if (!isUuid(id)) return { success: false, message: "Geçersiz yazı." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data: current } = await access.admin.from("posts").select("id,cover_path").or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
  if (!current) return { success: false, message: "Yazı bulunamadı." };
  const { error } = await access.admin.from("posts").delete().eq("id", current.id);
  if (error) return { success: false, message: "Yazı silinemedi." };
  const coverPath = storagePathFromUrl(current.cover_path);
  if (coverPath) await access.admin.storage.from("diji-post-media").remove([coverPath]);
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath("/dashboard"); return { success: true, message: "Yazı silindi." };
}
