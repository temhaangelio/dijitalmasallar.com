import { createClient } from "@/lib/supabase/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export type CmsPage = {
  id: string;
  slug: string;
  title_tr: string;
  title_en: string;
  content_tr: string;
  content_en: string;
  status: "draft" | "published";
  show_in_header: boolean;
  show_in_footer: boolean;
  menu_order: number;
  created_at: string;
  updated_at: string;
};

const columns = "id,slug,title_tr,title_en,content_tr,content_en,status,show_in_header,show_in_footer,menu_order,created_at,updated_at";

export async function getAdminPages(): Promise<CmsPage[]> {
  const access = await getAuthorizedAdminClient();
  if (!access) return [];
  const { data, error } = await access.admin.from("pages").select(columns).order("menu_order").order("created_at");
  return error ? [] : data as CmsPage[];
}

export async function getAdminPage(id: string): Promise<CmsPage | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const access = await getAuthorizedAdminClient();
  if (!access) return null;
  const { data, error } = await access.admin.from("pages").select(columns).eq("id", id).maybeSingle();
  return error ? null : data as CmsPage | null;
}

export async function getPublishedPages(): Promise<CmsPage[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").select(columns).eq("status", "published").order("menu_order").order("created_at");
  return error ? [] : data as CmsPage[];
}

export async function getPublishedPage(slug: string): Promise<CmsPage | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").select(columns).eq("slug", slug).eq("status", "published").maybeSingle();
  return error ? null : data as CmsPage | null;
}

export function localizedPage(page: CmsPage, language: "tr" | "en") {
  return {
    title: (language === "en" ? page.title_en : page.title_tr) || page.title_tr || page.title_en,
    content: (language === "en" ? page.content_en : page.content_tr) || page.content_tr || page.content_en,
  };
}
