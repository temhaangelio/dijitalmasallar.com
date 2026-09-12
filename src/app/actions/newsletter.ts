"use server";

import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { emailSchema } from "@/lib/validations/auth";
import { subscribeToNewsletter } from "@/services/newsletter";
import { getSiteSettings } from "@/services/settings";

/** An anonymous write, so it carries the same limiter as signing up for notifications. */
const rateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, maxAttempts: 20 });

const subscribeSchema = z.object({ email: emailSchema.max(254, "E-posta adresi çok uzun.") });

type Reply = { success: boolean; message: string };

const copy = {
  tr: {
    off: "E-bülten şu anda kapalı.",
    tooMany: "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.",
    invalid: "Geçerli bir e-posta adresi girin.",
    subscribed: "Kaydınız alındı.",
    already: "Bu adres zaten kayıtlı.",
    unavailable: "E-bülten kaydı şu anda yapılamıyor. Lütfen daha sonra tekrar deneyin.",
    error: "Kayıt tamamlanamadı. Lütfen tekrar deneyin.",
  },
  en: {
    off: "The newsletter is currently closed.",
    tooMany: "Too many attempts. Please try again later.",
    invalid: "Enter a valid e-mail address.",
    subscribed: "You are on the list.",
    already: "This address is already on the list.",
    unavailable: "Sign-up is unavailable right now. Please try again later.",
    error: "Sign-up could not be completed. Please try again.",
  },
} as const;

export async function subscribeToNewsletterAction(email: unknown, language: unknown): Promise<Reply> {
  const visitorLanguage = resolveVisitorLanguage(typeof language === "string" ? language : null);
  const words = copy[visitorLanguage];

  const settings = await getSiteSettings();
  if (!settings.moduleNewsletter) return { success: false, message: words.off };
  if (await rateLimited()) return { success: false, message: words.tooMany };

  const parsed = subscribeSchema.safeParse({ email });
  if (!parsed.success) return { success: false, message: words.invalid };

  const result = await subscribeToNewsletter(parsed.data.email, visitorLanguage);
  // Re-subscribing and a first sign-up look the same to the reader on purpose: whether an address
  // was already in the list is not something an anonymous form should confirm.
  if (result === "subscribed" || result === "resubscribed") return { success: true, message: words.subscribed };
  if (result === "already") return { success: true, message: words.already };
  if (result === "unavailable") return { success: false, message: words.unavailable };
  return { success: false, message: words.error };
}
