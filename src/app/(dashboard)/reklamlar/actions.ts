"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { inspectRasterUpload } from "@/lib/validate-image-upload";
import { publicStoragePath } from "@/lib/storage-path";
import { isUuid } from "@/lib/utils";

type ActionResult = { success: boolean; message: string };


function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }

function storagePathFromUrl(value: string | null) {
  return publicStoragePath(value, "ad-images", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function createAdAction(formData: FormData): Promise<ActionResult> {
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const title = text(formData, "title");
  const description = text(formData, "description");
  const ctaLabel = text(formData, "ctaLabel");
  const targetUrl = text(formData, "targetUrl");
  const language = text(formData, "language");
  const active = formData.get("active") === "true";
  if (language !== "tr" && language !== "en") return { success: false, message: "Geçerli bir reklam dili seçin." };
  if (title.length < 3 || title.length > 100) return { success: false, message: "Reklam başlığı 3–100 karakter olmalı." };
  if (description.length < 10 || description.length > 240) return { success: false, message: "Açıklama 10–240 karakter olmalı." };
  if (ctaLabel.length < 2 || ctaLabel.length > 30) return { success: false, message: "Buton metni 2–30 karakter olmalı." };
  try { const url = new URL(targetUrl); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { return { success: false, message: "Geçerli bir http veya https adresi girin." }; }

  const image = formData.get("image");
  let imageUrl: string | null = null;
  let uploadedPath: string | null = null;
  if (image instanceof File && image.size > 0) {
    let prepared: Awaited<ReturnType<typeof inspectRasterUpload>>;
    try { prepared = await inspectRasterUpload(image); }
    catch { return { success: false, message: "Geçerli, en fazla 5 MB boyutunda bir JPG, PNG, WebP veya GIF seçin." }; }
    uploadedPath = `${access.user.id}/${randomUUID()}.${prepared.extension}`;
    const { error: uploadError } = await access.admin.storage.from("ad-images").upload(uploadedPath, prepared.bytes, { contentType: prepared.contentType, upsert: false });
    if (uploadError) return { success: false, message: "Reklam görseli yüklenemedi." };
    imageUrl = access.admin.storage.from("ad-images").getPublicUrl(uploadedPath).data.publicUrl;
  }

  const { error } = await access.admin.from("ad_units").insert({ placement: "home_feed", label: language === "en" ? "AD" : "REKLAM", title, description, cta_label: ctaLabel, target_url: targetUrl, image_url: imageUrl, language, active });
  if (error) {
    if (uploadedPath) await access.admin.storage.from("ad-images").remove([uploadedPath]);
    return { success: false, message: "Reklam kaydedilemedi." };
  }
  revalidatePath("/"); revalidatePath("/reklamlar");
  return { success: true, message: "Reklam eklendi." };
}

export async function updateAdAction(id: string, formData: FormData): Promise<ActionResult> {
  if (!isUuid(id)) return { success: false, message: "Geçersiz reklam." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const title = text(formData, "title");
  const description = text(formData, "description");
  const ctaLabel = text(formData, "ctaLabel");
  const targetUrl = text(formData, "targetUrl");
  const language = text(formData, "language");
  const active = formData.get("active") === "true";
  const removeImage = formData.get("removeImage") === "true";
  if (language !== "tr" && language !== "en") return { success: false, message: "Geçerli bir reklam dili seçin." };
  if (title.length < 3 || title.length > 100) return { success: false, message: "Reklam başlığı 3–100 karakter olmalı." };
  if (description.length < 10 || description.length > 240) return { success: false, message: "Açıklama 10–240 karakter olmalı." };
  if (ctaLabel.length < 2 || ctaLabel.length > 30) return { success: false, message: "Buton metni 2–30 karakter olmalı." };
  try { const url = new URL(targetUrl); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { return { success: false, message: "Geçerli bir http veya https adresi girin." }; }

  const { data: current, error: currentError } = await access.admin.from("ad_units").select("id,image_url").eq("id", id).maybeSingle();
  if (currentError || !current) return { success: false, message: "Reklam bulunamadı." };

  const image = formData.get("image");
  let uploadedPath: string | null = null;
  let imageUrl = removeImage ? null : current.image_url;
  if (image instanceof File && image.size > 0) {
    let prepared: Awaited<ReturnType<typeof inspectRasterUpload>>;
    try { prepared = await inspectRasterUpload(image); }
    catch { return { success: false, message: "Geçerli, en fazla 5 MB boyutunda bir JPG, PNG, WebP veya GIF seçin." }; }
    uploadedPath = `${access.user.id}/${randomUUID()}.${prepared.extension}`;
    const { error: uploadError } = await access.admin.storage.from("ad-images").upload(uploadedPath, prepared.bytes, { contentType: prepared.contentType, upsert: false });
    if (uploadError) return { success: false, message: "Reklam görseli yüklenemedi." };
    imageUrl = access.admin.storage.from("ad-images").getPublicUrl(uploadedPath).data.publicUrl;
  }

  const { data, error } = await access.admin.from("ad_units").update({
    label: language === "en" ? "AD" : "REKLAM", title, description, cta_label: ctaLabel,
    target_url: targetUrl, image_url: imageUrl, language, active, updated_at: new Date().toISOString(),
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) {
    if (uploadedPath) await access.admin.storage.from("ad-images").remove([uploadedPath]);
    return { success: false, message: "Reklam güncellenemedi." };
  }

  if ((uploadedPath || removeImage) && current.image_url) {
    const oldPath = storagePathFromUrl(current.image_url);
    if (oldPath) await access.admin.storage.from("ad-images").remove([oldPath]);
  }
  revalidatePath("/"); revalidatePath("/reklamlar"); revalidatePath(`/reklamlar/${id}/duzenle`);
  return { success: true, message: "Reklam güncellendi." };
}

export async function updateAdLanguageAction(id: string, language: "tr" | "en"): Promise<ActionResult> {
  if (!isUuid(id) || (language !== "tr" && language !== "en")) return { success: false, message: "Geçersiz reklam dili." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { error } = await access.admin.from("ad_units").update({ language, label: language === "en" ? "AD" : "REKLAM", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, message: "Reklam dili güncellenemedi." };
  revalidatePath("/"); revalidatePath("/reklamlar");
  return { success: true, message: language === "en" ? "Reklam İngilizce akışa taşındı." : "Reklam Türkçe akışa taşındı." };
}

export async function toggleAdAction(id: string, active: boolean): Promise<ActionResult> {
  if (!isUuid(id) || typeof active !== "boolean") return { success: false, message: "Geçersiz reklam." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { error } = await access.admin.from("ad_units").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, message: "Reklam durumu güncellenemedi." };
  revalidatePath("/"); revalidatePath("/reklamlar");
  return { success: true, message: active ? "Reklam yayına alındı." : "Reklam durduruldu." };
}

export async function deleteAdAction(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { success: false, message: "Geçersiz reklam." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data } = await access.admin.from("ad_units").select("image_url").eq("id", id).maybeSingle();
  const { error } = await access.admin.from("ad_units").delete().eq("id", id);
  if (error) return { success: false, message: "Reklam silinemedi." };
  const path = storagePathFromUrl(data?.image_url ?? null);
  if (path) await access.admin.storage.from("ad-images").remove([path]);
  revalidatePath("/"); revalidatePath("/reklamlar");
  return { success: true, message: "Reklam silindi." };
}
