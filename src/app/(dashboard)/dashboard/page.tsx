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

export default async function DashboardPage() {
  const [postStats, analytics] = await Promise.all([getDashboardPostStats(), getAnalytics(7)]);
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("tr-TR", { timeZone, weekday: "long", day: "numeric", month: "long" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((item) => item.type === type)?.value ?? "";
  const numericParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const numberPart = (type: Intl.DateTimeFormatPartTypes) => Number(numericParts.find((item) => item.type === type)?.value ?? 0);
  const year = numberPart("year");
  const month = numberPart("month");
  const today = numberPart("day");
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay() || 7;
  const monthName = new Intl.DateTimeFormat("tr-TR", { timeZone, month: "long" }).format(now);
  const monthActivity = Math.round((postStats.publishedDaysThisMonth.length / Math.max(today, 1)) * 100);
  const publishedDays = new Set(postStats.publishedDaysThisMonth);
  const scheduledDays = new Set(postStats.scheduled.map((post) => Number(new Intl.DateTimeFormat("en", { timeZone, day: "numeric" }).format(new Date(post.scheduled_at ?? post.created_at)))));
  const maxViews = Math.max(...(analytics?.daily.map((day) => day.pageviews) ?? [0]), 1);
  const pageviewsChange = analytics?.pageviewsChange;

  return (
    <AppShell active="/dashboard">
      <PageHeader title="Dashboard" note={`${part("weekday")}, ${part("day")} ${part("month")} · bu hafta ${postStats.publishedThisWeek} yazı yayında`} actions={<Link href="/yazilar/yeni" className={buttonVariants()}>Yeni yazı <ArrowRight className="size-4" aria-hidden="true" /></Link>} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-12">
        <Card className="flex min-h-[300px] flex-col justify-between xl:col-span-2"><div className="text-[26px] font-bold capitalize tracking-[-.04em]">{part("weekday").slice(0, 3)} <span className="capitalize text-muted">{part("month").slice(0, 3)}</span></div><div className="text-[108px] font-bold leading-[.8] tracking-[-.06em]">{today}</div></Card>
        <Card className="min-h-[300px] xl:col-span-3"><div className="flex justify-between text-[26px] font-bold capitalize tracking-[-.04em]"><span>{monthName}</span><span className="text-muted">%{monthActivity}</span></div><div className="mt-7 grid grid-cols-7 gap-3">{Array.from({ length: daysInMonth }, (_, index) => <span key={index} title={`${index + 1} ${monthName}`} className={`size-[13px] rounded-full ${publishedDays.has(index + 1) ? "bg-ink" : "bg-line-strong"}`} />)}</div><p className="mt-8 text-sm font-medium text-muted">Bu ay {postStats.publishedThisMonth} yazı, {publishedDays.size} yayın günü</p></Card>
        <Card className="min-h-[300px] xl:col-span-7"><div className="flex justify-between"><h2 className="section-title">Son yazılar</h2><span className="text-[15px] font-medium text-muted">{postStats.total.toLocaleString("tr-TR")} yazı</span></div><div className="mt-6 space-y-4">{postStats.recent.length ? postStats.recent.map((post) => <Link href={`/yazilar/${post.id}/duzenle`} key={post.id} className="flex gap-3"><span className={`w-[3px] rounded-full ${post.status === "published" ? "bg-ink" : "bg-line-strong"}`} /><div><strong className="block text-base tracking-[-.022em]">{post.title}</strong><small className="text-sm font-medium text-muted">{post.status === "published" ? "Yayında" : "Planlı"} · {relativeTime(post.created_at)}</small></div></Link>) : <p className="text-sm text-muted">Henüz yazı bulunmuyor.</p>}</div></Card>
        <Card className="xl:col-span-5"><div className="flex justify-between"><h2 className="section-title">Yayın takvimi</h2><span className="text-muted">{postStats.scheduled.length} planlı yazı</span></div><div className="mt-6 grid grid-cols-7 gap-y-4 text-center">{["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((label) => <span key={label} className="text-sm font-semibold text-muted">{label}</span>)}{Array.from({ length: firstWeekday - 1 }, (_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; return <span key={day} className={scheduledDays.has(day) ? "mx-auto grid size-8 place-items-center rounded-full bg-ink font-semibold text-white" : day === today ? "mx-auto grid size-8 place-items-center rounded-full bg-line font-semibold" : "font-semibold"}>{day}</span>; })}</div></Card>
        <Card className="xl:col-span-7"><div className="flex justify-between"><h2 className="section-title">Görüntüleme</h2><span className="text-muted">Son 7 gün</span></div>{analytics ? <><div className="mt-4 text-[40px] font-bold tracking-[-.05em]">{analytics.pageviews.toLocaleString("tr-TR")} {pageviewsChange !== null && pageviewsChange !== undefined ? <span className="text-[15px] text-muted">{pageviewsChange >= 0 ? "+" : ""}%{pageviewsChange.toFixed(1).replace(".", ",")}</span> : null}</div><div className="mt-8 flex h-24 items-end gap-2">{analytics.daily.map((day) => <span key={day.date} className="flex-1 rounded bg-ink" title={`${day.date}: ${day.pageviews.toLocaleString("tr-TR")}`} style={{ height: `${Math.max((day.pageviews / maxViews) * 100, 3)}%` }} />)}</div></> : <p className="mt-8 text-sm text-muted">Vercel Analytics verisi şu anda alınamıyor.</p>}</Card>
      </div>
    </AppShell>
  );
}
