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
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";

async function ViewsCard() {
  const analytics = await getAnalytics(7, true);
  const max = Math.max(...(analytics?.daily.map(day => day.pageviews) ?? [0]), 1);
  return <Card>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="section-title">Okur hareketi</h2><Link href="/istatistik" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink">Son 7 gün<ArrowRight size={15} /></Link></div>
    {analytics ? <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10">
      <div className="shrink-0"><strong className="text-3xl font-medium tabular-nums tracking-tight">{analytics.pageviews.toLocaleString("tr-TR")}</strong><p className="mt-1 text-xs text-muted">Görüntüleme · {analytics.visitors.toLocaleString("tr-TR")} ziyaretçi</p></div>
      <div className="flex h-24 min-w-0 flex-1 items-end gap-2" role="img" aria-label={`Son 7 günde ${analytics.pageviews} görüntüleme`}>{analytics.daily.map(day => <span key={day.date} className="flex-1 rounded-t bg-ink/75" title={`${day.date}: ${day.pageviews}`} style={{ height: `${Math.max(day.pageviews / max * 100, 3)}%` }} />)}</div>
    </div> : <p className="py-8 text-sm leading-6 text-muted">İstatistik verisi şu anda alınamıyor. Yazılarınızı yönetmeye devam edebilirsiniz.</p>}
  </Card>;
}

export default async function DashboardPage() {
  const stats = await getDashboardPostStats();
  const today = new Date();
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(today);
  const [year, month, day] = key.split("-").map(Number);
  const monthName = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" }).format(today);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const published = new Set(stats.publishedDaysThisMonth);
  const next = stats.scheduled[0];
  return <AppShell active="/dashboard">
    <PageHeader title="Genel bakış" note={fullDateLabel(today.toISOString(), "tr")} actions={<Link href="/yazilar/yeni" className={buttonVariants()}><Plus size={17} />Yeni yazı</Link>} />
    <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-5">
      {[["Bu hafta", stats.publishedThisWeek], ["Bu ay", stats.publishedThisMonth], ["Planlı", stats.scheduledTotal]].map(([label, value]) => <Card key={label} className="!px-4 !py-5 sm:!px-6"><p className="text-xs text-muted">{label}</p><strong className="mt-2 block text-[28px] font-medium leading-none tabular-nums tracking-tight sm:text-[34px]">{Number(value).toLocaleString("tr-TR")}</strong></Card>)}
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,1fr)]">
      <Card>
        <div className="mb-2 flex items-center justify-between gap-3"><h2 className="section-title">Son notlar</h2><Link href="/yazilar" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted hover:text-ink">Tümü · {stats.total.toLocaleString("tr-TR")}<ArrowRight size={14} /></Link></div>
        <div className="divide-y divide-line">{stats.recent.length ? stats.recent.map(post => <Link prefetch={false} href={`/yazilar/${post.id}/duzenle`} key={post.id} className="group block rounded-lg py-4"><time dateTime={post.created_at} className="text-[11px] tabular-nums text-muted">{fullDateLabel(post.created_at, "tr")} · {timeLabel(post.created_at, "tr")}</time><h3 className="mt-1.5 line-clamp-2 font-[family-name:var(--font-source-serif)] text-[19px] leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{post.title}</h3></Link>) : <p className="py-10 text-sm text-muted">Henüz yayımlanmış not bulunmuyor.</p>}</div>
      </Card>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="section-title capitalize">{monthName}</h2><span className="text-xs text-muted">{published.size} yayın günü</span></div>
          <div className="mt-5 grid grid-cols-7 gap-1 text-center">
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"].map(label => <span key={label} className="pb-2 text-[10px] font-medium text-muted">{label}</span>)}
            {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: days }, (_, index) => <span key={index} title={`${index + 1} ${monthName}${published.has(index + 1) ? " · Yayın var" : ""}`} aria-current={index + 1 === day ? "date" : undefined} className={`mx-auto grid size-8 place-items-center rounded-full text-xs tabular-nums ${published.has(index + 1) ? "bg-ink text-white" : "text-muted"} ${index + 1 === day ? "ring-1 ring-line-strong ring-offset-2 ring-offset-surface" : ""}`}>{index + 1}</span>)}
          </div>
          <p className="mt-5 text-[11px] text-muted">Dolu günlerde en az bir not yayımlandı.</p>
        </Card>
        <Card><h2 className="section-title">Sıradaki yayın</h2>{next ? <Link prefetch={false} href={`/yazilar/${next.id}/duzenle`} className="mt-4 block rounded-lg"><time dateTime={next.created_at} className="text-xs text-muted">{fullDateLabel(next.created_at, "tr")} · {timeLabel(next.created_at, "tr")}</time><p className="mt-2 line-clamp-2 font-[family-name:var(--font-source-serif)] text-lg leading-snug">{next.title}</p></Link> : <p className="mt-3 text-sm leading-6 text-muted">Planlanmış bir not bulunmuyor.</p>}</Card>
      </div>
      <div className="xl:col-span-2"><Suspense fallback={<Card><Skeleton className="h-6 w-40" /><Skeleton className="mt-5 h-24 w-full" /><span role="status" className="sr-only">Okur hareketi yükleniyor</span></Card>}><ViewsCard /></Suspense></div>
    </div>
  </AppShell>;
}
