import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resultUrl(request: NextRequest, status: "onaylandi" | "hata") {
  return new URL(`/ebulten-onay?durum=${status}`, request.url);
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 2048) return NextResponse.redirect(resultUrl(request, "hata"), 303);
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") || "").trim();
  if (!uuidPattern.test(token)) return NextResponse.redirect(resultUrl(request, "hata"), 303);

  try {
    const service = createAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await service.from("newsletter_subscribers").update({
      status: "active",
      confirmation_expires_at: null,
      confirmed_at: now,
      updated_at: now,
    }).eq("confirmation_token", token).eq("status", "pending").gt("confirmation_expires_at", now).select("id").maybeSingle();
    if (error) return NextResponse.redirect(resultUrl(request, "hata"), 303);
    if (!data) {
      const { data: existing } = await service.from("newsletter_subscribers").select("status").eq("confirmation_token", token).maybeSingle();
      return NextResponse.redirect(resultUrl(request, existing?.status === "active" ? "onaylandi" : "hata"), 303);
    }
    return NextResponse.redirect(resultUrl(request, "onaylandi"), 303);
  } catch {
    return NextResponse.redirect(resultUrl(request, "hata"), 303);
  }
}
