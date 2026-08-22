import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/env";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (isAdmin === true) return NextResponse.redirect(new URL(next, request.url));
      await supabase.auth.signOut();
    }
  }
  return NextResponse.redirect(new URL("/giris?error=callback", request.url));
}
