"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { deletePushSubscription, isPushConfigured, savePushSubscription } from "@/services/push";
import { getSiteSettings } from "@/services/settings";

/** Subscribing is a write from an anonymous visitor, so it carries the same limiter as sign-up. */
const rateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, maxAttempts: 20 });

/**
 * The shape `PushSubscription.toJSON()` produces. Endpoints are long but bounded; anything past
 * these limits is not a browser subscription.
 */
const subscriptionSchema = z.object({
  endpoint: z.string().trim().min(20).max(1000).startsWith("https://", "Geçersiz abonelik adresi."),
  keys: z.object({
    p256dh: z.string().trim().min(1).max(255),
    auth: z.string().trim().min(1).max(255),
  }),
});

async function available() {
  if (!isPushConfigured()) return false;
  const settings = await getSiteSettings();
  return settings.modulePush;
}

export async function subscribeToPushAction(input: unknown, language: unknown) {
  if (!(await available())) return { success: false, message: "Bildirimler şu anda kapalı." };
  if (await rateLimited()) return { success: false, message: "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin." };

  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Abonelik bilgisi geçersiz." };

  const userAgent = (await headers()).get("user-agent");
  const saved = await savePushSubscription(parsed.data, resolveVisitorLanguage(typeof language === "string" ? language : null), userAgent);
  return saved
    ? { success: true, message: "Bildirimler açıldı." }
    : { success: false, message: "Bildirimler açılamadı. Lütfen tekrar deneyin." };
}

export async function unsubscribeFromPushAction(endpoint: unknown) {
  if (!isPushConfigured()) return { success: true, message: "Bildirimler kapatıldı." };
  const parsed = subscriptionSchema.shape.endpoint.safeParse(endpoint);
  // A browser that has already dropped the subscription has nothing to delete; the reader still
  // ends up unsubscribed, so this is not reported as a failure.
  if (!parsed.success) return { success: true, message: "Bildirimler kapatıldı." };

  const removed = await deletePushSubscription(parsed.data);
  return removed
    ? { success: true, message: "Bildirimler kapatıldı." }
    : { success: false, message: "Bildirimler kapatılamadı. Lütfen tekrar deneyin." };
}
