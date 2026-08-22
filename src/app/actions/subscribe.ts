"use server";

import { getAppUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailSchema } from "@/lib/validations/auth";
import { headers } from "next/headers";

const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 5;

async function rateLimited() {
  const requestHeaders = await headers();
  const ip = (requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown").split(",")[0].trim();
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  if (attempts.size > 5000) attempts.delete(attempts.keys().next().value ?? ip);
  return current.count > maxAttempts;
}

async function sendConfirmationEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY || process.env.MAIL_KEY;
  if (!apiKey) return false;
  const confirmationUrl = `${getAppUrl()}/ebulten-onay/${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "diji.news <bulten@dijitalmasallar.com>",
      to: [email],
      subject: "E-bülten aboneliğinizi onaylayın",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111"><h1 style="font-size:28px">E-posta adresinizi onaylayın.</h1><p style="line-height:1.6;color:#555">diji.news teknoloji seçkisine katılmak için aşağıdaki bağlantıyı açın.</p><p style="margin:28px 0"><a href="${confirmationUrl}" style="display:inline-block;border-radius:999px;background:#000;color:#fff;padding:13px 20px;text-decoration:none;font-weight:700">Aboneliği onayla</a></p><small style="color:#777">Bağlantı 24 saat geçerlidir. Bu isteği siz yapmadıysanız e-postayı yok sayabilirsiniz.</small></div>`,
    }),
  });
  return response.ok;
}

export async function subscribeAction(value: unknown) {
  if (await rateLimited()) return { success: false, message: "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin." };
  const parsed = emailSchema.safeParse(value);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "E-posta adresini kontrol edin." };

  try {
    const email = parsed.data.normalize("NFKC").trim().toLowerCase();
    const service = createAdminClient();
    const { data: existing, error: lookupError } = await service
      .from("newsletter_subscribers")
      .select("status,confirmation_token,confirmation_expires_at,unsubscribe_token")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) return { success: false, message: "Kaydınız kontrol edilemedi." };
    if (existing?.status === "active") return { success: true, message: "Bu adres zaten bültene kayıtlı." };

    const now = new Date();
    const reusableToken = existing?.status === "pending" && existing.confirmation_token && existing.confirmation_expires_at
      && new Date(existing.confirmation_expires_at).getTime() > now.getTime();
    const confirmationToken = reusableToken ? existing.confirmation_token : crypto.randomUUID();
    const { error } = await service.from("newsletter_subscribers").upsert({
      email,
      status: "pending",
      source: "diji_news",
      unsubscribe_token: existing?.unsubscribe_token || crypto.randomUUID(),
      confirmation_token: confirmationToken,
      confirmation_sent_at: now.toISOString(),
      confirmation_expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      confirmed_at: null,
      updated_at: now.toISOString(),
    }, { onConflict: "email" });
    if (error) return { success: false, message: "Kayıt tamamlanamadı." };
    if (!(await sendConfirmationEmail(email, confirmationToken))) {
      return { success: false, message: "Onay e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin." };
    }
    return { success: true, message: "Harika — doğrulama bağlantısını e-postanıza gönderdik." };
  } catch {
    return { success: false, message: "Bülten bağlantısı şu anda kullanılamıyor." };
  }
}
