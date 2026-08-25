import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { languageFromAcceptLanguage, visitorLanguageCookie, type VisitorLanguage } from "@/lib/visitor-language";

const languageAwareVisitorPaths = new Set(["/", "/about", "/contact", "/newsletter", "/search", "/settings"]);

function validLanguage(value?: string | null): VisitorLanguage | null {
  return value === "tr" || value === "en" ? value : null;
}

function rememberLanguage(response: NextResponse, language: VisitorLanguage) {
  response.cookies.set(visitorLanguageCookie, language, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function proxy(request: NextRequest) {
  if (!languageAwareVisitorPaths.has(request.nextUrl.pathname)) return updateSession(request);

  if (request.method !== "GET" && request.method !== "HEAD") return updateSession(request);

  const explicitLanguage = validLanguage(request.nextUrl.searchParams.get("lang"));
  if (explicitLanguage) {
    return rememberLanguage(await updateSession(request), explicitLanguage);
  }

  const savedLanguage = validLanguage(request.cookies.get(visitorLanguageCookie)?.value);
  const language = savedLanguage ?? languageFromAcceptLanguage(request.headers.get("accept-language"));
  if (language === "tr") {
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.searchParams.set("lang", "tr");
    return rememberLanguage(NextResponse.redirect(localizedUrl), language);
  }

  const response = await updateSession(request);
  return savedLanguage ? response : rememberLanguage(response, language);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
