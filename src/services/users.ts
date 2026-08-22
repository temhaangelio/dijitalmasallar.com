import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/types/database";
import { cache } from "react";

export type CurrentProfile = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_path: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
  email: string;
  post_count: number;
  last_seen: string;
};

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  try {
    const access = await getAuthorizedAdminClient();
    if (!access || !access.user.email) return null;
    const [{ data: member }, { count: postCount }] = await Promise.all([
      access.admin.from("admin_users").select("email,role,created_at").eq("email", access.user.email).maybeSingle(),
      access.admin.from("posts").select("id", { count: "exact", head: true }).eq("author_id", access.user.id),
    ]);
    if (!member) return null;
    const metadata = access.user.user_metadata ?? {};
    return {
      id: access.user.id,
      user_id: access.user.id,
      full_name: String(metadata.full_name ?? metadata.name ?? access.user.email.split("@")[0]),
      avatar_path: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      role: member.role as ProfileRole,
      created_at: access.user.created_at,
      updated_at: access.user.updated_at ?? access.user.created_at,
      email: access.user.email,
      post_count: postCount ?? 0,
      last_seen: access.user.last_sign_in_at ?? "—",
    };
  } catch {
    return null;
  }
});
