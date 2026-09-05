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

export const getAuthorizedAdminClient = cache(async () => {
  try {
    const sessionClient = await createClient();
    // Confirm the account still exists and is active, not just that its JWT signature is valid.
    const { data: { user }, error: userError } = await sessionClient.auth.getUser();
    if (userError || !user?.id || !user.email) return null;

    const { data: isAdmin, error: roleError } = await sessionClient.rpc("is_admin");
    if (roleError || isAdmin !== true) return null;

    return {
      admin: createAdminClient(),
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata ?? {},
      },
    };
  } catch {
    return null;
  }
});
