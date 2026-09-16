import { NextResponse } from "next/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { renderIssueForPreview, issueDay } from "@/services/newsletter-send";

/**
 * The issue as the reader will see it, opened in a tab from the panel.
 *
 * The message is built by the same code the send uses, so what is previewed here is what goes out —
 * only the unsubscribe link differs, carrying a token that belongs to nobody. Behind the admin
 * check like every other panel route: the preview contains the day's notes, and a scheduled day's
 * notes are not public yet.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  /* The preview is read inside a frame in the panel, so an expired session would otherwise show as
     an empty white rectangle. A short page says what happened instead. */
  if (!(await getAuthorizedAdminClient())) {
    return new NextResponse(
      '<!doctype html><meta charset="utf-8"><body style="margin:0;display:grid;place-items:center;height:100vh;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;color:#6a6a6a;background:#fff">Oturum doğrulanamadı. Sayfayı yenileyip tekrar deneyin.</body>',
      { status: 401, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const query = new URL(request.url).searchParams;
  const requested = query.get("gun") ?? "";
  const day = /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : issueDay();
  const language = query.get("dil") === "en" ? "en" : "tr";

  const { html } = await renderIssueForPreview(day, language);
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
