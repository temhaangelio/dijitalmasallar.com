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

/* ------------------------------------------------------------------------------------------------
 * Sending
 * ---------------------------------------------------------------------------------------------- */

/** One row of the send list: the address and the key its unsubscribe link carries. */
export type SendableSubscriber = { email: string; unsubscribeToken: string };

/**
 * Everyone who should receive the next issue in one language.
 *
 * Only `subscribed` rows: an address that asked to be taken off stays in the table so it cannot be
 * silently re-added, and this is the query that has to respect that.
 */
export async function listSendableSubscribers(language: VisitorLanguage): Promise<SendableSubscriber[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createAdminClient()
      .from("newsletter_subscribers")
      .select("email,unsubscribe_token")
      .eq("status", "subscribed")
      .eq("language", language)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) return [];
    return ((data ?? []) as { email: string; unsubscribe_token: string }[])
      .filter((row) => Boolean(row.unsubscribe_token))
      .map((row) => ({ email: row.email, unsubscribeToken: row.unsubscribe_token }));
  } catch {
    return [];
  }
}

export type UnsubscribeResult = "unsubscribed" | "already" | "unknown" | "error";

/**
 * The link at the foot of every message.
 *
 * A token rather than an address, so a link that ends up somewhere it should not cannot be edited
 * into a way of unsubscribing another reader. A token that matches nothing answers `unknown` and
 * says so plainly: pretending it worked would leave someone believing they are off a list they are
 * still on.
 */
export async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  if (!isSupabaseConfigured()) return "error";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.trim())) return "unknown";
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("email,status")
      .eq("unsubscribe_token", token.trim())
      .maybeSingle();
    if (error) return missingTable(error) ? "unknown" : "error";
    if (!data) return "unknown";
    if ((data as { status: string }).status === "unsubscribed") return "already";

    const { error: updateError } = await admin
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("unsubscribe_token", token.trim());
    return updateError ? "error" : "unsubscribed";
  } catch {
    return "error";
  }
}

/** One issue that has gone out: a day, a language and what the provider accepted. */
export type NewsletterIssue = {
  day: string;
  language: VisitorLanguage;
  subject: string;
  postCount: number;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: string;
};

const issueColumns = "day,language,subject,post_count,recipient_count,sent_count,failed_count,sent_at";

type IssueRow = { day: string; language: string; subject: string; post_count: number; recipient_count: number; sent_count: number; failed_count: number; sent_at: string };

function toIssue(row: IssueRow): NewsletterIssue {
  return {
    day: row.day,
    language: row.language === "en" ? "en" : "tr",
    subject: row.subject,
    postCount: row.post_count,
    recipientCount: row.recipient_count,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    sentAt: row.sent_at,
  };
}

/** What the panel reads to say whether a day has already gone out. */
export async function listNewsletterIssues(limit = 20): Promise<NewsletterIssue[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createAdminClient()
      .from("newsletter_issues")
      .select(issueColumns)
      .order("sent_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data ?? []) as IssueRow[]).map(toIssue);
  } catch {
    return [];
  }
}

/**
 * Written after the provider has answered, never before: a row here means mail actually left, and
 * that is what the panel's "gönderildi" line and the re-send warning both rest on. A day sent again
 * replaces its row rather than adding a second one, so the record always says when the readers last
 * heard from us.
 */
export async function recordNewsletterIssue(issue: Omit<NewsletterIssue, "sentAt">) {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await createAdminClient()
      .from("newsletter_issues")
      .upsert({
        day: issue.day,
        language: issue.language,
        subject: issue.subject,
        post_count: issue.postCount,
        recipient_count: issue.recipientCount,
        sent_count: issue.sentCount,
        failed_count: issue.failedCount,
        sent_at: new Date().toISOString(),
      }, { onConflict: "day,language" });
    return !error;
  } catch {
    return false;
  }
}

/** Why the panel cannot send yet, if it cannot. */
export type SendReadiness = "ready" | "missing" | "error";

/**
 * Whether the database has what a send needs: the unsubscribe key on every subscriber and the table
 * the send log is written to.
 *
 * Asked rather than assumed, because both arrive with a migration that is applied by hand. Without
 * the check a panel on a database that is one migration behind would read the list as empty and say
 * "abone yok" — which is not what is wrong, and not something the person looking at it could tell
 * from the screen.
 */
export async function checkSendReadiness(): Promise<SendReadiness> {
  if (!isSupabaseConfigured()) return "error";
  try {
    const admin = createAdminClient();
    const [tokens, issues] = await Promise.all([
      admin.from("newsletter_subscribers").select("unsubscribe_token").limit(1),
      admin.from("newsletter_issues").select("day").limit(1),
    ]);
    // `42703` is Postgres's unknown column; the table codes are the ones `missingTable` knows.
    const absent = (error: { code?: string } | null) => missingTable(error) || error?.code === "42703";
    if (absent(tokens.error) || absent(issues.error)) return "missing";
    if (tokens.error || issues.error) return "error";
    return "ready";
  } catch {
    return "error";
  }
}
