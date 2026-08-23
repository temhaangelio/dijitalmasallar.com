import { createAdminClient, getAuthorizedAdminClient } from "@/lib/supabase/admin";
import type { Newsletter } from "@/types/database";

export type NewsletterStats = { active: number; pending: number; unsubscribed: number; sent: number; openRate: number; clickRate: number };
export type NewsletterSubscriber = { id: string; email: string; status: "active" | "pending" | "unsubscribed"; source: string | null; created_at: string; confirmed_at: string | null };
/** The dashboard only lists campaigns, so the full `content` body never leaves the database. */
export type NewsletterSummary = Pick<Newsletter, "id" | "subject" | "preview_text" | "issue_number" | "status" | "scheduled_at" | "sent_at" | "recipient_count" | "open_count" | "click_count" | "created_at">;
export type NewsletterDashboard = { newsletters: NewsletterSummary[]; subscribers: NewsletterSubscriber[]; stats: NewsletterStats };

/** Both dashboard lists are display-only, so they are capped instead of streaming the whole table. */
const campaignLimit = 100;
const subscriberLimit = 100;

export async function getActiveSubscriberCount() {
  try {
    const { count, error } = await createAdminClient().from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "active");
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export async function getNewsletterDashboard(): Promise<NewsletterDashboard> {
  const empty = { newsletters: [], subscribers: [], stats: { active: 0, pending: 0, unsubscribed: 0, sent: 0, openRate: 0, clickRate: 0 } };
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return empty;
    const statuses = ["active", "pending", "unsubscribed"] as const;
    const [campaignResult, subscribersResult, ...subscriberResults] = await Promise.all([
      access.admin.from("newsletter_campaigns").select("id,subject,preview_text,issue_number,status,scheduled_at,sent_at,recipient_count,open_count,click_count,created_at").order("issue_number", { ascending: false }).limit(campaignLimit),
      access.admin.from("newsletter_subscribers").select("id,email,status,source,created_at,confirmed_at").order("created_at", { ascending: false }).limit(subscriberLimit),
      ...statuses.map((status) => access.admin.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", status)),
    ]);
    if (campaignResult.error || subscribersResult.error) throw campaignResult.error ?? subscribersResult.error;
    const newsletters = (campaignResult.data ?? []) as NewsletterSummary[];
    const sent = newsletters.filter((newsletter) => newsletter.status === "sent");
    const recipients = sent.reduce((sum, newsletter) => sum + newsletter.recipient_count, 0);
    const opens = sent.reduce((sum, newsletter) => sum + newsletter.open_count, 0);
    const clicks = sent.reduce((sum, newsletter) => sum + newsletter.click_count, 0);
    return {
      newsletters,
      subscribers: (subscribersResult.data ?? []) as NewsletterSubscriber[],
      stats: {
        active: subscriberResults[0].count ?? 0,
        pending: subscriberResults[1].count ?? 0,
        unsubscribed: subscriberResults[2].count ?? 0,
        sent: sent.length,
        openRate: recipients ? (opens / recipients) * 100 : 0,
        clickRate: recipients ? (clicks / recipients) * 100 : 0,
      },
    };
  } catch {
    return empty;
  }
}
