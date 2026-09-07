import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/states";
import { getAnalytics } from "@/services/analytics";
import { getDashboardPostStats } from "@/services/posts";
import { DashboardOverview } from "@/components/features/dashboard/dashboard-overview";
import { fullDateLabel } from "@/lib/visitor-date";

const weekdayFormat = new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: "Europe/Istanbul" });

async function ViewsCard() {
  const analytics = await getAnalytics(7, true);
  const max = Math.max(...(analytics?.daily.map(day => day.pageviews) ?? [0]), 1);
  return <Card>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="section-title">Okur hareketi</h2><Link href="/istatistik" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink">Son 7 gün<ArrowRight size={15} /></Link></div>
    {analytics ? <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10">
      <div className="shrink-0"><strong className="text-3xl font-medium tabular-nums tracking-tight">{analytics.pageviews.toLocaleString("tr-TR")}</strong><p className="mt-1 text-xs text-muted">Görüntüleme · {analytics.visitors.toLocaleString("tr-TR")} ziyaretçi</p></div>
      {/* Seven grey blocks said “a chart is here” and nothing else: no day carried a name, so a
          spike could not be placed in the week. The bars keep their shape and gain a label. */}
      <div className="flex min-w-0 flex-1 items-end gap-2" role="img" aria-label={`Son 7 günde ${analytics.pageviews} görüntüleme`}>
        {analytics.daily.map(day => <span key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="flex h-20 w-full items-end"><span className="w-full rounded-t bg-ink/70" title={`${day.date}: ${day.pageviews}`} style={{ height: `${Math.max(day.pageviews / max * 100, 3)}%` }} /></span>
          <span className="text-[10px] tabular-nums text-faint">{weekdayFormat.format(new Date(`${day.date}T12:00:00+03:00`))}</span>
        </span>)}
      </div>
    </div> : <p className="py-8 text-sm leading-6 text-muted">İstatistik verisi şu anda alınamıyor. Yazılarınızı yönetmeye devam edebilirsiniz.</p>}
  </Card>;
}

export default async function DashboardPage() {
  const stats = await getDashboardPostStats();
  const today = new Date();
  return <AppShell active="/dashboard">
    <PageHeader title="Genel bakış" note={fullDateLabel(today.toISOString(), "tr")} actions={<Link href="/yazilar/yeni" className={buttonVariants()}><Plus size={17} />Yeni yazı</Link>} />
    <DashboardOverview
      stats={stats}
      today={today}
      viewsSlot={<Suspense fallback={<Card><Skeleton className="h-6 w-40" /><Skeleton className="mt-5 h-24 w-full" /><span role="status" className="sr-only">Okur hareketi yükleniyor</span></Card>}><ViewsCard /></Suspense>}
    />
  </AppShell>;
}
