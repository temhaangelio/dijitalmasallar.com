import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase sunucu değişkenleri eksik.");
  return createSupabaseClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function checkDatabaseHealth() {
  try {
    const { error } = await createAdminClient().from("posts").select("id", { head: true, count: "exact" }).limit(1);
    return !error;
  } catch {
    return false;
  }
}

export const getAuthorizedAdminClient = cache(async () => {
  try {
    const sessionClient = await createClient();
    const [{ data: userData }, { data: isAdmin }] = await Promise.all([
      sessionClient.auth.getUser(),
      sessionClient.rpc("is_admin"),
    ]);
    if (!userData.user?.email || isAdmin !== true) return null;
    return { admin: createAdminClient(), user: userData.user };
  } catch {
    return null;
  }
});
