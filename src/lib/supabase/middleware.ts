import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/env";

const protectedPaths = ["/dashboard", "/yazilar", "/reklamlar", "/istatistik"];
const authPaths = ["/giris", "/sifremi-unuttum"];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  const pathname = request.nextUrl.pathname;
  if (!user && protectedPaths.some((path) => pathname.startsWith(path))) {
    const login = request.nextUrl.clone();
    login.pathname = "/giris";
    login.searchParams.set("next", safeNextPath(pathname));
    return NextResponse.redirect(login);
  }
  if (user && authPaths.some((path) => pathname.startsWith(path))) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin === true) return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}
