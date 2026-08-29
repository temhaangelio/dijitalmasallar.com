"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorState } from "@/components/feedback/states";
import { RssDialog as AnalyticsDialog } from "@/components/features/rss/rss-dialog";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalyticsData, AnalyticsRange } from "@/services/analytics";

const number = new Intl.NumberFormat("tr-TR");

function changeLabel(value: number | null) {
  if (value === null) return "önceki dönemde veri yok";
  const sign = value > 0 ? "+" : "";
  return `${sign}%${Math.abs(value) < 0.05 ? "0" : value.toFixed(1).replace(".", ",")} önceki döneme göre`;
}

function dayLabel(value: string, days: AnalyticsRange) {
  return new Intl.DateTimeFormat("tr-TR", days === 7 ? { weekday: "short" } : { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00Z`));
}

export function AnalyticsDashboard({ analytics, range, missingEnv = [] }: { analytics: AnalyticsData | null; range: AnalyticsRange; missingEnv?: string[] }) {
  const [openList, setOpenList] = useState<"sources" | "pages" | "countries" | null>(null);
  const ranges: { days: AnalyticsRange; label: string; href: string }[] = [
    { days: 1, label: "1 gün", href: "/istatistik?aralik=1" },
    { days: 7, label: "7 gün", href: "/istatistik?aralik=7" },
    { days: 30, label: "30 gün", href: "/istatistik" },
    { days: 365, label: "Tümü", href: "/istatistik?aralik=all" },
  ];
  if (!analytics) {
    return (
      <Card>
        <ErrorState
          message={missingEnv.length
            ? `Vercel Analytics yapılandırılmamış. Eksik ortam değişkeni: ${missingEnv.join(", ")}.`
            : "Vercel istatistikleri şu anda alınamadı. Erişim anahtarı geçerli görünmüyor veya Vercel API'sine ulaşılamıyor."}
        />
        {missingEnv.length ? (
          <p className="mt-4 text-sm leading-6 text-muted">
            Erişim anahtarını <code className="rounded bg-surface-2 px-1.5 py-0.5">.env.local</code> dosyasına ve Vercel proje ayarlarındaki
            Environment Variables bölümüne ekleyin. Ayrı bir Analytics proje kimliği tanımlamanız gerekmez.
            <code className="ml-1 rounded bg-surface-2 px-1.5 py-0.5">VERCEL_ANALYTICS_TEAM_ID</code> yalnızca proje bir takıma bağlıysa gerekir.
          </p>
        ) : null}
      </Card>
    );
  }

  const maxViews = Math.max(...analytics.daily.map((day) => day.pageviews), 1);
  const yMax = Math.ceil(maxViews / 10) * 10;
  const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];
  const pagePerVisitor = analytics.visitors ? analytics.pageviews / analytics.visitors : 0;
  const dailyAverage = analytics.pageviews / range;
  const refreshed = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(analytics.updatedAt));

  return <div className="xl:flex xl:h-[calc(100dvh-130px)] xl:min-h-0 xl:flex-col xl:overflow-hidden">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between xl:mb-4">
      <p className="text-[15px] font-medium text-muted">{range === 365 ? "Tüm zamanlar" : `Son ${range} gün`} · {number.format(analytics.pageviews)} görüntüleme · {refreshed} itibarıyla</p>
      <div className="flex gap-2">{ranges.map((item) => <Link key={item.days} href={item.href} className={buttonVariants({ variant: item.days === range ? "primary" : "outline", size: "sm" })}>{item.label}</Link>)}</div>
    </div>

    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {[
        ["Görüntüleme", number.format(analytics.pageviews), changeLabel(analytics.pageviewsChange)],
        ["Tekil okur", number.format(analytics.visitors), changeLabel(analytics.visitorsChange)],
        ["Ziyaretçi başına", pagePerVisitor.toFixed(1).replace(".", ","), "sayfa görüntüleme"],
        ["Günlük ortalama", number.format(Math.round(dailyAverage)), "görüntüleme"],
      ].map(([label, value, note]) => <Card key={label} className="flex h-[132px] flex-col justify-between xl:h-24 xl:p-5"><strong>{label}</strong><div><span className="text-[40px] font-bold leading-none tracking-[-.05em] xl:text-[32px]">{value}</span><small className="ml-2 text-muted">{note}</small></div></Card>)}
    </div>

    <div className="mt-5 grid gap-5 xl:mt-4 xl:min-h-0 xl:flex-1 xl:grid-cols-12 xl:grid-rows-2 xl:gap-4">
      <Card className="xl:col-span-8 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <div className="flex justify-between"><h2 className="section-title">Günlük görüntüleme</h2><span className="text-muted">{range === 365 ? "Tüm zamanlar" : `Son ${range} gün`}</span></div>
        <div className="mt-8 flex h-[270px] gap-3 xl:mt-4 xl:h-[140px]">
          <div className="flex w-10 shrink-0 flex-col justify-between pb-7 text-right text-xs font-medium tabular-nums text-muted">{yTicks.map((tick) => <span key={tick}>{number.format(tick)}</span>)}</div>
          <div className="min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative flex h-full min-w-[620px] items-end gap-1.5 border-b border-line-strong">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 grid h-[calc(100%-28px)] grid-rows-4"><span className="border-t border-line" /><span className="border-t border-line" /><span className="border-t border-line" /><span className="border-y border-line" /></div>
              {analytics.daily.map((day, index) => {
                const height = day.pageviews === 0 ? 2 : Math.max((day.pageviews / yMax) * 100, 4);
                const showLabel = range === 7 || index % (range === 365 ? 30 : 5) === 0 || index === analytics.daily.length - 1;
                return <div key={day.date} className="group relative z-[1] flex h-[calc(100%-28px)] min-w-0 flex-1 items-end" title={`${dayLabel(day.date, range)}: ${number.format(day.pageviews)} görüntüleme, ${number.format(day.visitors)} okur`}>
                  <span className="relative w-full rounded-t bg-ink transition-opacity group-hover:opacity-70" style={{ height: `${height}%` }}><span className={cn("absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold tabular-nums", !showLabel && "sr-only")}>{number.format(day.pageviews)}</span></span>
                  <span className={cn("absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted", !showLabel && "sr-only")}>{dayLabel(day.date, range)}</span>
                </div>;
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="xl:col-span-4 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <h2 className="section-title">Trafik kaynakları</h2>
        <div className="mt-4 space-y-2">{analytics.sources.slice(0, 3).map((source) => <div key={source.label}><div className="mb-1 flex justify-between gap-3 text-sm font-semibold"><span className="truncate">{source.label}</span><span>%{Math.round(source.percentage)}</span></div><div className="h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(source.percentage, 1)}%` }} /></div></div>)}</div>
        <button type="button" onClick={() => setOpenList("sources")} className="mt-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Tümünü göster</button>
      </Card>

      <Card className="xl:col-span-8 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <div className="flex justify-between"><h2 className="section-title">En çok ziyaret edilenler</h2><span className="text-muted">{range === 365 ? "Tümü" : `${range} gün`}</span></div>
        <div className="mt-3 divide-y divide-line">{analytics.topPages.slice(0, 3).map((page, index) => <div key={page.path} className="grid grid-cols-[36px_minmax(0,1fr)_80px_90px] gap-3 py-1.5"><span className="font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span><strong className="truncate">{page.path === "/" ? "Ana sayfa" : page.path}</strong><span className="text-right text-muted">{number.format(page.visitors)} okur</span><span className="text-right font-semibold">{number.format(page.pageviews)}</span></div>)}</div>
        <button type="button" onClick={() => setOpenList("pages")} className="mt-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Tümünü göster</button>
      </Card>

      <Card className="xl:col-span-4 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <h2 className="section-title">Okur dağılımı</h2>
        <div className="mt-4 space-y-2">{analytics.countries.slice(0, 3).map((country) => <div key={country.code} className="flex items-center justify-between"><span className="font-semibold">{country.label}</span><span className="text-muted">%{Math.round(country.percentage)}</span></div>)}</div>
        <button type="button" onClick={() => setOpenList("countries")} className="mt-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Tümünü göster</button>
      </Card>
    </div>

    {openList && (
      <AnalyticsDialog
        title={openList === "sources" ? "Trafik kaynakları" : openList === "pages" ? "En çok ziyaret edilenler" : "Okur dağılımı"}
        onClose={() => setOpenList(null)}
        panelClassName="max-h-[88dvh] !max-w-[760px] overflow-hidden"
      >
        <div className="mt-5 max-h-[60dvh] overflow-y-auto pr-2">
          {openList === "sources" && <div className="space-y-4">{analytics.sources.map((source) => <div key={source.label}><div className="mb-2 flex justify-between gap-3 text-sm font-semibold"><span className="truncate">{source.label}</span><span>{number.format(source.visitors)} okur · %{Math.round(source.percentage)}</span></div><div className="h-2 rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(source.percentage, 1)}%` }} /></div></div>)}</div>}
          {openList === "pages" && <div className="divide-y divide-line">{analytics.topPages.map((page, index) => <div key={page.path} className="grid grid-cols-[36px_minmax(0,1fr)_90px_100px] gap-3 py-3 text-sm"><span className="font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span><strong className="truncate">{page.path === "/" ? "Ana sayfa" : page.path}</strong><span className="text-right text-muted">{number.format(page.visitors)} okur</span><span className="text-right font-semibold">{number.format(page.pageviews)} görüntüleme</span></div>)}</div>}
          {openList === "countries" && <div className="divide-y divide-line">{analytics.countries.map((country) => <div key={country.code} className="flex items-center justify-between gap-4 py-3"><span className="font-semibold">{country.label}</span><span className="text-muted">{number.format(country.visitors)} okur · %{Math.round(country.percentage)}</span></div>)}</div>}
        </div>
      </AnalyticsDialog>
    )}
  </div>;
}
