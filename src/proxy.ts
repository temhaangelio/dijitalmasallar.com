import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Public reading routes do not need an auth refresh on every request.
export const config = { matcher: ["/dashboard/:path*", "/yazilar/:path*", "/reklamlar/:path*", "/istatistik/:path*", "/rss/:path*", "/giris", "/sifremi-unuttum", "/sifre-yenile", "/auth/:path*"] };
