import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DailyIssue } from "@/components/features/newsletter/daily-issue";
import { NewsletterTabs } from "@/components/features/newsletter/newsletter-tabs";
import { SubscribersList } from "@/components/features/newsletter/subscribers-list";
import type { IssueDayView } from "@/app/(dashboard)/bulten/actions";
import { isMailConfigured } from "@/lib/mail";
import { checkSendReadiness, listNewsletterIssues, listNewsletterSubscribers } from "@/services/newsletter";
import { getIssuePreviews, issueDay } from "@/services/newsletter-send";
import { getPostDays } from "@/services/posts";

/** The list changes whenever a reader signs up, so it is never served from a cache. */
export const dynamic = "force-dynamic";
/** A send waits on the mail provider once per hundred addresses, so it needs more than the default. */
export const maxDuration = 300;

const sentAtFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

/** One figure of the list's state: a large number, or a date set smaller so it fits on one line. */
function Stat({ label, value, note, small = false }: { label: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-[11px] text-muted">{label}</p>
      <strong className={`mt-1.5 block font-medium leading-none tabular-nums tracking-tight ${small ? "text-[15px] sm:text-[17px]" : "text-[26px] sm:text-[30px]"}`}>{value}</strong>
      {note ? <p className="mt-1.5 text-[11px] text-faint">{note}</p> : null}
    </div>
  );
}

export default async function NewsletterAdminPage() {
  const day = issueDay();
  const [{ subscribers, total, unsubscribed, status }, previews, issues, readiness, days] = await Promise.all([
    listNewsletterSubscribers(),
    getIssuePreviews(day),
    listNewsletterIssues(200),
    checkSendReadiness(),
    getPostDays(120),
  ]);

  const lastIssue = issues[0] ?? null;

  const views: IssueDayView[] = previews.map((preview) => {
    const issue = issues.find((row) => row.day === day && row.language === preview.language);
    return {
      language: preview.language,
      paragraphs: preview.paragraphs,
      recipients: preview.recipients,
      sent: issue ? { sentAt: issue.sentAt, sentCount: issue.sentCount, failedCount: issue.failedCount } : null,
    };
  });

  return (
    <AppShell active="/bulten">
      <PageHeader
        title="E-bülten"
      />
      <NewsletterTabs
        recipientCount={total}
        send={(
          <DailyIssue
            days={days}
            initialDay={day}
            initialViews={views}
            sentDays={[...new Set(issues.map((issue) => issue.day))]}
            addresses={subscribers.filter((row) => row.status === "subscribed").map((row) => ({ email: row.email, language: row.language }))}
            mailReady={isMailConfigured()}
            readiness={readiness}
          />
        )}
        recipients={(
          <>
            <Card className="mb-5 !p-0">
              <div className="grid grid-cols-3 divide-x divide-line">
                <Stat label="Kayıtlı" value={total.toLocaleString("tr-TR")} />
                <Stat label="Çıkmış" value={unsubscribed.toLocaleString("tr-TR")} />
                {/* The third tile used to be "Toplam", which is the other two added up — a number the
                    eye already has. What is nowhere else on the page is when the list last heard
                    from us. */}
                <Stat
                  label="Son gönderim"
                  value={lastIssue ? sentAtFormat.format(new Date(lastIssue.sentAt)) : "—"}
                  note={lastIssue ? `${lastIssue.sentCount.toLocaleString("tr-TR")} e-posta` : "henüz gönderilmedi"}
                  small
                />
              </div>
            </Card>
            <SubscribersList subscribers={subscribers} status={status} />
          </>
        )}
      />
    </AppShell>
  );
}
