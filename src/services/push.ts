import "server-only";

import webpush, { WebPushError } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

type SubscriptionRow = { endpoint: string; p256dh: string; auth: string; language: VisitorLanguage };

/** What one language's readers see on the lock screen. */
export type PushMessage = { title: string; body: string; url: string };

/**
 * The public key is handed to the browser by the page that renders the toggle, rather than being
 * inlined at build time through a `NEXT_PUBLIC_` variable: it keeps all three VAPID values together
 * in one server-side group, and a key rotation then takes effect on the next request instead of the
 * next deploy.
 */
export function pushPublicKey() {
  return process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
}

/** Without the key pair there is nothing to subscribe to, so the whole feature stays hidden. */
export function isPushConfigured() {
  return Boolean(pushPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim() && isSupabaseConfigured());
}

function configure() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:merhaba@dijitalmasallar.com",
    pushPublicKey(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
}

export async function savePushSubscription(subscription: PushSubscriptionInput, language: VisitorLanguage, userAgent: string | null) {
  const now = new Date().toISOString();
  const { error } = await createAdminClient().from("push_subscriptions").upsert({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    language,
    user_agent: userAgent?.slice(0, 300) ?? null,
    last_seen_at: now,
  }, { onConflict: "endpoint" });
  if (error) {
    console.error("Push subscription upsert failed", { code: error.code, message: error.message });
    return false;
  }
  return true;
}

export async function deletePushSubscription(endpoint: string) {
  const { error } = await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) {
    console.error("Push subscription delete failed", { code: error.code, message: error.message });
    return false;
  }
  return true;
}

/** Endpoints are sent in batches so one note does not open a thousand sockets at once. */
const batchSize = 100;

/**
 * Sends one note to every subscriber, in the language that subscriber signed up in.
 *
 * A push service answers 404 or 410 for a subscription the browser has thrown away — the reader
 * cleared their site data, uninstalled the app, or changed browsers. Those endpoints are deleted
 * here; keeping them would mean retrying dead endpoints on every note forever.
 */
export async function sendPushToSubscribers(messages: Record<VisitorLanguage, PushMessage>, tag?: string) {
  if (!isPushConfigured()) return { sent: 0, failed: 0, removed: 0 };
  configure();

  const admin = createAdminClient();
  const { data, error } = await admin.from("push_subscriptions").select("endpoint,p256dh,auth,language");
  if (error) {
    console.error("Push subscription read failed", { code: error.code, message: error.message });
    return { sent: 0, failed: 0, removed: 0 };
  }

  const rows = (data ?? []) as SubscriptionRow[];
  const expired: string[] = [];
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map((row) => {
      const message = messages[row.language] ?? messages.en;
      return webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify({ title: message.title, body: message.body, url: message.url, lang: row.language, tag }),
        { TTL: 60 * 60 * 12, urgency: "normal" },
      );
    }));

    results.forEach((result, position) => {
      if (result.status === "fulfilled") { sent++; return; }
      failed++;
      const reason = result.reason;
      if (reason instanceof WebPushError && (reason.statusCode === 404 || reason.statusCode === 410)) {
        expired.push(batch[position].endpoint);
      } else {
        console.error("Push send failed", { statusCode: reason instanceof WebPushError ? reason.statusCode : undefined });
      }
    });
  }

  if (expired.length) {
    const { error: cleanupError } = await admin.from("push_subscriptions").delete().in("endpoint", expired);
    if (cleanupError) console.error("Push cleanup failed", { code: cleanupError.code, message: cleanupError.message });
  }

  return { sent, failed, removed: expired.length };
}

export type NewPostNotification = {
  id: string;
  tr: { title: string; excerpt: string };
  en: { title: string; excerpt: string };
};

/** A notification body longer than this is cut off by the platform anyway. */
const bodyLimit = 140;

function trim(value: string, limit: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1).trimEnd()}…` : clean;
}

/**
 * The one place a published note turns into a lock-screen line. Both languages are composed here,
 * and `sendPushToSubscribers` gives each reader the one they signed up in.
 *
 * The post id is the notification tag, so a note that is somehow sent twice replaces itself instead
 * of arriving twice.
 */
export async function notifyNewPost(post: NewPostNotification) {
  if (!isPushConfigured()) return { sent: 0, failed: 0, removed: 0 };
  const settings = await getSiteSettings();
  if (!settings.modulePush) return { sent: 0, failed: 0, removed: 0 };

  return sendPushToSubscribers({
    tr: {
      title: trim(post.tr.title, 80) || settings.siteName,
      body: trim(post.tr.excerpt, bodyLimit),
      url: languageHref(`/haber/${post.id}`, "tr"),
    },
    en: {
      title: trim(post.en.title, 80) || settings.siteName,
      body: trim(post.en.excerpt, bodyLimit),
      url: languageHref(`/haber/${post.id}`, "en"),
    },
  }, post.id);
}
