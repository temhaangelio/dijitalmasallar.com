import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/states";
import { getAnalytics } from "@/services/analytics";
import { getBriefPosts, getDashboardPostStats } from "@/services/posts";
import { getPublishedDays } from "@/services/daily-audio";
import { listNewsletterIssues } from "@/services/newsletter";
import { DashboardOverview, OverviewCard, OverviewCounts, ReaderActivity, type DailyRoutine } from "@/components/features/dashboard/dashboard-overview";
import { dateKey, fullDateLabel } from "@/lib/visitor-date";

async function ViewsCard() {
  return <ReaderActivity analytics={await getAnalytics(7, true)} />;
}

/** How many days of the standing routine the overview answers for. */
const routineDays = 3;

/**
 * Whether the last few days' recordings were published and their bulletins sent.
 *
 * Both are keyed by the day they are *about*, not the day the work was done, which is how the
 * podcast panel and the bulletin panel key them too — so a row here reads the same as those pages.
 * The note count comes along because a day with no notes has nothing to record or send, and an empty
 * day should not look like a missed one.
 */
async function getDailyRoutine(today: Date): Promise<DailyRoutine[]> {
  const days = Array.from({ length: routineDays }, (_, index) => dateKey(new Date(today.getTime() - index * 86_400_000).toISOString()));
  const oldest = days[days.length - 1];

  const [audioTr, audioEn, issues, posts] = await Promise.all([
    getPublishedDays("tr"),
    getPublishedDays("en"),
    listNewsletterIssues(60),
    getBriefPosts(`${oldest}T00:00:00+03:00`, `${days[0]}T23:59:59.999+03:00`, "tr"),
  ]);

  const publishedTr = new Set(audioTr);
  const publishedEn = new Set(audioEn);
  const noteCount = new Map<string, number>();
  for (const post of posts) {
    const key = dateKey(post.created_at);
    noteCount.set(key, (noteCount.get(key) ?? 0) + 1);
  }

  return days.map((day, index) => ({
    day,
    label: fullDateLabel(`${day}T12:00:00+03:00`, "tr"),
    relative: index === 0 ? "Bugün" : index === 1 ? "Dün" : null,
    notes: noteCount.get(day) ?? 0,
    audio: { tr: publishedTr.has(day), en: publishedEn.has(day) },
    issue: {
      tr: issues.some((issue) => issue.day === day && issue.language === "tr"),
      en: issues.some((issue) => issue.day === day && issue.language === "en"),
    },
  }));
}

export default async function DashboardPage() {
  const today = new Date();
  const [stats, routine] = await Promise.all([getDashboardPostStats(), getDailyRoutine(today)]);
  return <AppShell active="/dashboard">
    <PageHeader title="Genel bakış" actions={<><OverviewCounts stats={stats} /><Link href="/yazilar/yeni" className={buttonVariants()}><Plus size={17} />Yeni yazı</Link></>} />
    <DashboardOverview
      stats={stats}
      today={today}
      routine={routine}
      viewsSlot={<Suspense fallback={<OverviewCard title="Okur hareketi"><Skeleton className="h-7 w-32" /><Skeleton className="mt-4 h-24 w-full flex-1" /><span role="status" className="sr-only">Okur hareketi yükleniyor</span></OverviewCard>}><ViewsCard /></Suspense>}
    />
  </AppShell>;
}
