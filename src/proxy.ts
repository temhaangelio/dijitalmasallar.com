import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveVisitorLanguage } from "@/lib/visitor-language";

/** The panel and sign-in routes, which refresh the Supabase session on every request. */
const sessionRoutes = ["/dashboard", "/yazilar", "/gunun-ozeti", "/reklamlar", "/istatistik", "/rss", "/bulten", "/giris", "/sifremi-unuttum", "/sifre-yenile", "/auth"];

/**
 * Public pages skip the auth refresh; they only learn their language here, from `?lang`, so the
 * root layout can put it on `<html lang>` — the one place search engines and assistants read a
 * page's language from, and which a layout cannot work out from the query string on its own.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (sessionRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return updateSession(request);
  const headers = new Headers(request.headers);
  headers.set("x-visitor-language", resolveVisitorLanguage(searchParams.get("lang")));
  return NextResponse.next({ request: { headers } });
}

// Everything but API routes, Next's own assets and files with an extension (images, sitemap.xml, robots.txt…).
export const config = { matcher: ["/((?!api/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"] };
