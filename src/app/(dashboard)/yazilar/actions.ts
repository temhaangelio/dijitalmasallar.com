"use server";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { parsePostContent } from "@/lib/post-content";
import { discoverSourceImage } from "@/lib/source-image";
import { inspectRasterUpload } from "@/lib/validate-image-upload";
import { publicStoragePath } from "@/lib/storage-path";
import { isUuid } from "@/lib/utils";
import { postSchema } from "@/lib/validations/post";
import { getPostsPage, type PostPublicationFilter, type PostSort } from "@/services/posts";
import { notifyNewPost } from "@/services/push";

const postSorts: PostSort[] = ["newest", "oldest", "title-asc", "title-desc"];
const postStatuses: PostPublicationFilter[] = ["all", "published", "scheduled", "draft"];
const acceptedImages = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxCoverWidth = 1200;
const maxCoverHeight = 675;
const coverQuality = 85;

function storagePathFromUrl(value: string | null) {
  return publicStoragePath(value, "diji-post-media", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

async function uploadCover(access: NonNullable<Awaited<ReturnType<typeof getAuthorizedAdminClient>>>, image: File | null) {
  if (image !== null && !(image instanceof File)) return { url: null, path: null, error: "Geçersiz görsel dosyası." };
  if (!image || image.size === 0) return { url: null, path: null, error: null };
  if (!acceptedImages.has(image.type)) return { url: null, path: null, error: "Görsel JPG, PNG veya WebP olmalı." };
  if (image.size > 5 * 1024 * 1024) return { url: null, path: null, error: "Görsel 5 MB’dan küçük olmalı." };
  let optimized: Buffer;
  try {
    const { bytes: source } = await inspectRasterUpload(image);
    const metadata = await sharp(source, { limitInputPixels: 25_000_000 }).metadata();
    const isPreparedWebp = image.type === "image/webp"
      && metadata.width === maxCoverWidth
      && metadata.height === maxCoverHeight;
    optimized = isPreparedWebp
      ? source
      : await sharp(source, { limitInputPixels: 25_000_000 })
          .rotate()
          .resize({ width: maxCoverWidth, height: maxCoverHeight, fit: "inside", withoutEnlargement: true })
          .webp({ quality: coverQuality, effort: 4 })
          .toBuffer();
  } catch (error) {
    console.error("[posts] Cover image processing failed", {
      type: image.type,
      size: image.size,
      error: error instanceof Error ? error.message : String(error),
    });
    return { url: null, path: null, error: "Görsel işlenemedi. Başka bir JPG, PNG veya WebP deneyin." };
  }
  const path = `${access.user.id}/${randomUUID()}.webp`;
  const { error } = await access.admin.storage.from("diji-post-media").upload(path, optimized, { contentType: "image/webp", upsert: false });
  if (error) return { url: null, path: null, error: "Kapak görseli yüklenemedi." };
  return { url: access.admin.storage.from("diji-post-media").getPublicUrl(path).data.publicUrl, path, error: null };
}

export async function loadMorePostsAction(page: number, pageSize = 20, language: "tr" | "en" = "tr", sort: PostSort = "newest", search = "", status: PostPublicationFilter = "all") {
  const safePage = Number.isSafeInteger(page) && page >= 1 ? Math.min(page, 100_000) : 1;
  const safePageSize = Number.isInteger(pageSize) ? Math.min(Math.max(pageSize, 1), 50) : 20;
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false as const, message: "Bu işlem için yönetici yetkisi gerekir." };

  try {
    const safeSort = postSorts.includes(sort) ? sort : "newest";
    const safeStatus = postStatuses.includes(status) ? status : "all";
    const result = await getPostsPage(safePage, safePageSize, language === "en" ? "en" : "tr", safeSort, String(search).slice(0, 120), safeStatus);
    return { success: true as const, ...result };
  } catch {
    return { success: false as const, message: "Yazılar yüklenemedi. Lütfen tekrar deneyin." };
  }
}

/**
 * Push goes out after the response, through `after`, so the editor's save is never held up by a
 * thousand endpoints — and a push service having a bad day cannot turn a saved note into an error.
 */
function notifyPublishedPost(id: string, data: { tr: { body: string }; en: { body: string } }) {
  const tr = parsePostContent(data.tr.body);
  const en = parsePostContent(data.en.body);
  after(async () => {
    try {
      await notifyNewPost({ id, tr: { title: tr.title, excerpt: tr.excerpt }, en: { title: en.title, excerpt: en.excerpt } });
    } catch (error) {
      console.error("Push notification for new post failed", error);
    }
  });
}

export async function createPostAction(input: unknown, image: File | null = null, libraryPostId: string | null = null) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Yazıyı kontrol edin." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const library = await resolveLibraryCover(access, libraryPostId);
  if (library.error) return { success: false, message: library.error };
  const cover = await uploadCover(access, image);
  if (cover.error) return { success: false, message: cover.error };
  const coverUrl = cover.url ?? library.url ?? (parsed.data.status === "draft" ? null : await discoverSourceImage(parsed.data.sourceUrl));
  const createdAt = parsed.data.status === "scheduled" ? new Date(parsed.data.scheduledAt!).toISOString() : new Date().toISOString();
  const { data: created, error } = await access.admin.from("posts").insert({
    is_draft: parsed.data.status === "draft",
    content_tr: parsed.data.tr.body,
    content_en: parsed.data.en.body,
    source_url: parsed.data.sourceUrl,
    cover_path: coverUrl,
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
  if (created?.id && parsed.data.status === "published") notifyPublishedPost(created.id, parsed.data);
  return { success: true, message: parsed.data.status === "draft" ? "Taslak kaydedildi." : "Yazı kaydedildi." };
}

export async function updatePostAction(id: string, input: unknown, image: File | null = null, removeCover = false, libraryPostId: string | null = null) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success || !isUuid(id)) return { success: false, message: "Geçersiz yazı bilgisi." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data: current } = await access.admin.from("posts").select("id,created_at,cover_path,is_draft").or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
  if (!current) return { success: false, message: "Yazı bulunamadı." };
  const wasScheduled = new Date(current.created_at).getTime() > Date.now();
  const library = await resolveLibraryCover(access, libraryPostId);
  if (library.error) return { success: false, message: library.error };
  const cover = await uploadCover(access, image);
  if (cover.error) return { success: false, message: cover.error };
  const discoveredCoverUrl = parsed.data.status !== "draft" && !cover.url && !library.url && !removeCover && !current.cover_path ? await discoverSourceImage(parsed.data.sourceUrl) : null;
  const createdAt = parsed.data.status === "draft"
    ? current.created_at
    : parsed.data.status === "scheduled"
    ? new Date(parsed.data.scheduledAt!).toISOString()
    : parsed.data.publishedAt
      ? new Date(parsed.data.publishedAt).toISOString()
      : wasScheduled || current.is_draft
        ? new Date().toISOString()
        : current.created_at;
  const { error } = await access.admin.from("posts").update({
    is_draft: parsed.data.status === "draft",
    content_tr: parsed.data.tr.body,
    content_en: parsed.data.en.body,
    source_url: parsed.data.sourceUrl,
    cover_path: cover.url ?? library.url ?? discoveredCoverUrl ?? (removeCover ? null : current.cover_path),
    created_at: createdAt,
  }).eq("id", current.id);
  if (error) {
    if (cover.path) await access.admin.storage.from("diji-post-media").remove([cover.path]);
    console.error("Supabase post update failed", { code: error.code, message: error.message });
    return { success: false, message: "Yazı güncellenemedi. Lütfen tekrar deneyin." };
  }
  if ((cover.url || library.url || removeCover) && current.cover_path) await removeUnusedCover(access, current.cover_path);
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath(`/yazilar/${id}/duzenle`); revalidatePath("/dashboard");
  // Only the moment a scheduled note is pulled forward counts as publishing it; ordinary edits to an
  // already-published note must not notify the same readers again.
  if ((wasScheduled || current.is_draft) && parsed.data.status === "published") notifyPublishedPost(current.id, parsed.data);
  return { success: true, message: parsed.data.status === "draft" ? "Taslak kaydedildi." : "Yazı güncellendi." };
}

export async function deletePostAction(id: string) {
  if (!isUuid(id)) return { success: false, message: "Geçersiz yazı." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data: current } = await access.admin.from("posts").select("id,cover_path").or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
  if (!current) return { success: false, message: "Yazı bulunamadı." };
  const { error } = await access.admin.from("posts").delete().eq("id", current.id);
  if (error) return { success: false, message: "Yazı silinemedi." };
  if (current.cover_path) await removeUnusedCover(access, current.cover_path);
  revalidatePath("/"); revalidatePath("/yazilar"); revalidatePath("/dashboard"); return { success: true, message: "Yazı silindi." };
}

async function resolveLibraryCover(access: NonNullable<Awaited<ReturnType<typeof getAuthorizedAdminClient>>>, id: string | null) {
  if (id === null) return { url: null, error: null };
  if (!isUuid(id)) return { url: null, error: "Geçersiz kütüphane görseli." };
  const { data, error } = await access.admin.from("posts").select("cover_path").eq("id", id).maybeSingle();
  return error || !data?.cover_path ? { url: null, error: "Bu görsel artık kütüphanede yok. Yeniden seçin." } : { url: data.cover_path as string, error: null };
}

async function removeUnusedCover(access: NonNullable<Awaited<ReturnType<typeof getAuthorizedAdminClient>>>, url: string) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  const { count, error } = await access.admin.from("posts").select("id", { count: "exact", head: true }).eq("cover_path", url);
  if (!error && count === 0) await access.admin.storage.from("diji-post-media").remove([path]);
}

export async function loadCoverLibraryAction(page = 1, search = "") {
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false as const, message: "Bu işlem için yönetici yetkisi gerekir." };
  const safePage = Number.isSafeInteger(page) ? Math.min(Math.max(page, 1), 10000) : 1;
  const pageSize = 12;
  const from = (safePage - 1) * pageSize;
  let query = access.admin.from("posts").select("id,cover_path,content_tr,created_at")
    .not("cover_path", "is", null);
  const term = String(search).trim().slice(0, 120);
  if (term) {
    const pattern = `"%${term.replace(/[\\%_"]/g, "\\$&")}%"`;
    query = query.or(`content_tr.ilike.${pattern},content_en.ilike.${pattern}`);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).order("id").range(from, from + pageSize);
  if (error) return { success: false as const, message: "Görseller yüklenemedi. Tekrar deneyin." };
  return { success: true as const, hasMore: data.length > pageSize, items: data.slice(0, pageSize).map(row => ({
    id: row.id as string, url: row.cover_path as string, title: parsePostContent(row.content_tr).title || "Kapak görseli",
  })) };
}
