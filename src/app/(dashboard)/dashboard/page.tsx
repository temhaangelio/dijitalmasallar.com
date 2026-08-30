import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getAnalytics } from "@/services/analytics";
import { getDashboardPostStats } from "@/services/posts";

const timeZone = "Europe/Istanbul";

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(elapsed / 3_600_000));
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

function scheduledTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { timeZone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function DashboardPage() {
  const [postStats, analytics] = await Promise.all([getDashboardPostStats(), getAnalytics(7)]);
  const now = new Date();
  const numericParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const numberPart = (type: Intl.DateTimeFormatPartTypes) => Number(numericParts.find((item) => item.type === type)?.value ?? 0);
  const year = numberPart("year");
  const month = numberPart("month");
  const today = numberPart("day");
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthName = new Intl.DateTimeFormat("tr-TR", { timeZone, month: "long" }).format(now);
  const monthActivity = Math.round((postStats.publishedDaysThisMonth.length / Math.max(today, 1)) * 100);
  const publishedDays = new Set(postStats.publishedDaysThisMonth);
  const nextScheduled = postStats.scheduled[0];
  const maxViews = Math.max(...(analytics?.daily.map((day) => day.pageviews) ?? [0]), 1);
  const pageviewsChange = analytics?.pageviewsChange;

  return (
    <AppShell active="/dashboard">
      <PageHeader title="Dashboard" actions={<Link href="/yazilar/yeni" className={buttonVariants()}>Yeni yazı <ArrowRight className="size-4" aria-hidden="true" /></Link>} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:h-[calc(100dvh-130px)] xl:grid-cols-12 xl:grid-rows-2">
        <Card className="min-h-[300px] xl:col-span-6 xl:min-h-0 xl:overflow-hidden xl:p-5"><div className="flex justify-between text-[26px] font-bold capitalize tracking-[-.04em]"><span>{monthName}</span><span className="text-muted">%{monthActivity}</span></div><div className="mt-7 grid grid-cols-7 gap-3 xl:mt-5">{Array.from({ length: daysInMonth }, (_, index) => <span key={index} title={`${index + 1} ${monthName}`} className={`size-[13px] rounded-full ${publishedDays.has(index + 1) ? "bg-ink" : "bg-line-strong"}`} />)}</div><p className="mt-8 text-sm font-medium text-muted xl:mt-5">Bu ay {postStats.publishedThisMonth} yazı, {publishedDays.size} yayın günü</p></Card>
        <Card className="min-h-[300px] xl:col-span-6 xl:min-h-0 xl:overflow-hidden xl:p-5"><div className="flex justify-between"><h2 className="section-title">Son yazılar</h2><span className="text-[15px] font-medium text-muted">{postStats.total.toLocaleString("tr-TR")} yazı</span></div><div className="mt-6 space-y-4 xl:mt-4 xl:space-y-3">{postStats.recent.length ? postStats.recent.map((post) => <Link href={`/yazilar/${post.id}/duzenle`} key={post.id} className="flex gap-3"><span className={`w-[3px] rounded-full ${post.status === "published" ? "bg-ink" : "bg-line-strong"}`} /><div><strong className="block text-base tracking-[-.022em]">{post.title}</strong><small className="text-sm font-medium text-muted">{post.status === "published" ? "Yayında" : "Planlı"} · {relativeTime(post.created_at)}</small></div></Link>) : <p className="text-sm text-muted">Henüz yazı bulunmuyor.</p>}</div></Card>
        <Card className="xl:col-span-6 xl:min-h-0 xl:overflow-hidden xl:p-5">
          <div className="flex items-center justify-between"><h2 className="section-title">Editör özeti</h2><span className="text-sm font-medium text-muted">Güncel durum</span></div>
          <div className="mt-5 grid grid-cols-3 gap-3 xl:mt-4">
            {[
              ["Bu hafta", postStats.publishedThisWeek],
              ["Bu ay", postStats.publishedThisMonth],
              ["Planlı", postStats.scheduled.length],
            ].map(([label, value]) => <div key={label} className="rounded-field bg-surface-2 px-4 py-3"><small className="font-medium text-muted">{label}</small><strong className="mt-1 block text-[28px] leading-none tracking-[-.04em]">{value}</strong></div>)}
          </div>
          {nextScheduled ? (
            <Link href={`/yazilar/${nextScheduled.id}/duzenle`} className="group mt-4 flex items-center justify-between gap-4 rounded-field border border-line px-4 py-3 transition-colors hover:bg-surface-2">
              <div className="min-w-0"><small className="font-medium text-muted">Sıradaki planlı yayın · {scheduledTime(nextScheduled.scheduled_at ?? nextScheduled.created_at)}</small><strong className="mt-1 block truncate text-[15px]">{nextScheduled.title}</strong></div><ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-field border border-dashed border-line px-4 py-3"><p className="text-sm text-muted">Planlanmış bir yazı bulunmuyor.</p><Link href="/yazilar/yeni" className="shrink-0 text-sm font-semibold underline decoration-line-strong underline-offset-4">Yazı ekle</Link></div>
          )}
        </Card>
        <Card className="xl:col-span-6 xl:min-h-0 xl:overflow-hidden xl:p-5"><div className="flex justify-between"><h2 className="section-title">Görüntüleme</h2><span className="text-muted">Son 7 gün</span></div>{analytics ? <><div className="mt-4 text-[40px] font-bold tracking-[-.05em]">{analytics.pageviews.toLocaleString("tr-TR")} {pageviewsChange !== null && pageviewsChange !== undefined ? <span className="text-[15px] text-muted">{pageviewsChange >= 0 ? "+" : ""}%{pageviewsChange.toFixed(1).replace(".", ",")}</span> : null}</div><div className="mt-8 flex h-24 items-end gap-2 xl:mt-5 xl:h-20">{analytics.daily.map((day) => <span key={day.date} className="flex-1 rounded bg-ink" title={`${day.date}: ${day.pageviews.toLocaleString("tr-TR")}`} style={{ height: `${Math.max((day.pageviews / maxViews) * 100, 3)}%` }} />)}</div></> : <p className="mt-8 text-sm text-muted">Vercel Analytics verisi şu anda alınamıyor.</p>}</Card>
      </div>
    </AppShell>
  );
}
