import { createClient } from "@/lib/supabase/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/utils";

export type Advertisement = {
  id: string;
  placement: string;
  label: string;
  title: string;
  description: string;
  cta_label: string;
  target_url: string;
  image_url: string | null;
  language: "tr" | "en";
  active: boolean;
  created_at: string;
  updated_at: string;
};

const columns = "id,placement,label,title,description,cta_label,target_url,image_url,language,active,created_at,updated_at";

export async function getAds(): Promise<Advertisement[]> {
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return [];
    const { data, error } = await access.admin.from("ad_units").select(columns).order("created_at", { ascending: false });
    if (error) return [];
    return data as Advertisement[];
  } catch {
    return [];
  }
}

export async function getAdById(id: string): Promise<Advertisement | null> {
  if (!isUuid(id)) return null;
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return null;
    const { data, error } = await access.admin.from("ad_units").select(columns).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data as Advertisement;
  } catch {
    return null;
  }
}

export async function getActiveAds(language: "tr" | "en"): Promise<Advertisement[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("ad_units").select(columns).eq("active", true).eq("placement", "home_feed").eq("language", language).order("created_at", { ascending: false });
    if (error) return [];
    return data as Advertisement[];
  } catch {
    return [];
  }
}
