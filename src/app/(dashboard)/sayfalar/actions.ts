"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";

type Result = { success: boolean; message: string; id?: string };
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const slugify = (value: string) => value.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function payload(data: FormData) {
  const titleTr = text(data, "title_tr");
  const titleEn = text(data, "title_en");
  return {
    slug: slugify(text(data, "slug") || titleTr || titleEn),
    title_tr: titleTr,
    title_en: titleEn,
    content_tr: text(data, "content_tr"),
    content_en: text(data, "content_en"),
    status: text(data, "status") === "published" ? "published" : "draft",
    show_in_header: data.get("show_in_header") === "on",
    show_in_footer: data.get("show_in_footer") === "on",
    menu_order: Math.min(Math.max(Number.parseInt(text(data, "menu_order"), 10) || 0, 0), 999),
  };
}

function validate(value: ReturnType<typeof payload>): string | null {
  if (!value.slug || value.slug.length > 80) return "Geçerli ve en fazla 80 karakterli bir adres girin.";
  if (!value.title_tr && !value.title_en) return "En az bir dilde sayfa başlığı girin.";
  if (!value.content_tr && !value.content_en) return "En az bir dilde sayfa içeriği girin.";
  return null;
}

function refresh(slug?: string) {
  revalidatePath("/sayfalar");
  revalidatePath("/");
  revalidatePath("/hakkinda");
  if (slug) revalidatePath(`/sayfa/${slug}`);
}

export async function createPageAction(data: FormData): Promise<Result> {
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const value = payload(data);
  const invalid = validate(value);
  if (invalid) return { success: false, message: invalid };
  const { data: created, error } = await access.admin.from("pages").insert({ ...value, created_by: access.user.id }).select("id").single();
  if (error) return { success: false, message: error.code === "23505" ? "Bu sayfa adresi zaten kullanılıyor." : "Sayfa kaydedilemedi." };
  refresh(value.slug);
  return { success: true, message: "Sayfa oluşturuldu.", id: created.id };
}

export async function updatePageAction(id: string, data: FormData): Promise<Result> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { success: false, message: "Geçersiz sayfa." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const value = payload(data);
  const invalid = validate(value);
  if (invalid) return { success: false, message: invalid };
  const { error } = await access.admin.from("pages").update({ ...value, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, message: error.code === "23505" ? "Bu sayfa adresi zaten kullanılıyor." : "Sayfa güncellenemedi." };
  refresh(value.slug);
  return { success: true, message: "Sayfa güncellendi.", id };
}

export async function deletePageAction(id: string): Promise<Result> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { success: false, message: "Geçersiz sayfa." };
  const access = await getAuthorizedAdminClient();
  if (!access) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
  const { data } = await access.admin.from("pages").select("slug").eq("id", id).maybeSingle();
  const { error } = await access.admin.from("pages").delete().eq("id", id);
  if (error) return { success: false, message: "Sayfa silinemedi." };
  refresh(data?.slug);
  return { success: true, message: "Sayfa silindi." };
}
