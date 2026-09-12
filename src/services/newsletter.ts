import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { VisitorLanguage } from "@/lib/visitor-language";

export type NewsletterSubscriber = {
  email: string;
  language: VisitorLanguage;
  status: "subscribed" | "unsubscribed";
  created_at: string;
  updated_at: string;
};

export type SubscribeResult = "subscribed" | "already" | "resubscribed" | "unavailable" | "error";

/**
 * The table is not there yet.
 *
 * PostgREST answers a request for an unknown table with `PGRST205` and a 404 rather than passing
 * Postgres's own `42P01` through, so both are checked: the first is what the running site sees
 * before the migration is applied, the second is what a direct SQL path would report.
 */
function missingTable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

const columns = "email,language,status,created_at,updated_at";

/**
 * Addresses are stored folded to lower case, and the table's own check enforces it. Trimming and
 * folding here means the same person cannot appear twice under different capitalisation, and the
 * primary key can then do the de-duplication for us.
 */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * The list is a list of readers' e-mail addresses, so every call goes through the service-role
 * client and none of it is reachable with the anon key. A database that does not have the table yet
 * — the migration has not been applied — reports `unavailable` rather than throwing, so the page
 * can say something honest instead of failing.
 */
export async function subscribeToNewsletter(email: string, language: VisitorLanguage): Promise<SubscribeResult> {
  if (!isSupabaseConfigured()) return "unavailable";
  const address = normalizeEmail(email);
  try {
    const admin = createAdminClient();
    const { data: existing, error: readError } = await admin
      .from("newsletter_subscribers")
      .select("status")
      .eq("email", address)
      .maybeSingle();
    if (readError) return missingTable(readError) ? "unavailable" : "error";

    if (existing?.status === "subscribed") return "already";

    const now = new Date().toISOString();
    const { error } = await admin
      .from("newsletter_subscribers")
      .upsert(
        { email: address, language, status: "subscribed", updated_at: now, ...(existing ? {} : { created_at: now }) },
        { onConflict: "email" },
      );
    if (error) return missingTable(error) ? "unavailable" : "error";
    return existing ? "resubscribed" : "subscribed";
  } catch {
    return "error";
  }
}

/** `missing` is the migration not being applied yet; `error` is anything else going wrong. */
export type NewsletterListStatus = "ok" | "missing" | "error";
export type NewsletterList = { subscribers: NewsletterSubscriber[]; total: number; unsubscribed: number; status: NewsletterListStatus };

const emptyList = (status: NewsletterListStatus): NewsletterList => ({ subscribers: [], total: 0, unsubscribed: 0, status });

/** Everything the panel shows, in one round trip. The list is small enough not to need paging yet. */
export async function listNewsletterSubscribers(limit = 500): Promise<NewsletterList> {
  if (!isSupabaseConfigured()) return emptyList("error");
  try {
    const { data, error } = await createAdminClient()
      .from("newsletter_subscribers")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return emptyList(missingTable(error) ? "missing" : "error");
    const subscribers = (data ?? []) as NewsletterSubscriber[];
    return {
      subscribers,
      total: subscribers.filter((row) => row.status === "subscribed").length,
      unsubscribed: subscribers.filter((row) => row.status === "unsubscribed").length,
      status: "ok",
    };
  } catch {
    return emptyList("error");
  }
}

/** Unsubscribing keeps the row: an address that asked to be removed must not be re-added silently. */
export async function setSubscriberStatus(email: string, status: NewsletterSubscriber["status"]) {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await createAdminClient()
      .from("newsletter_subscribers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("email", normalizeEmail(email));
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSubscriber(email: string) {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await createAdminClient()
      .from("newsletter_subscribers")
      .delete()
      .eq("email", normalizeEmail(email));
    return !error;
  } catch {
    return false;
  }
}
