"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Eye, Gauge, Users } from "lucide-react";
import { ErrorState } from "@/components/feedback/states";
import { AppDialog as AnalyticsDialog } from "@/components/ui/app-dialog";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalyticsData, AnalyticsRange } from "@/services/analytics";

const number = new Intl.NumberFormat("tr-TR");

function changeLabel(value: number | null) {
  if (value === null) return "önceki dönemde veri yok";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}%${Math.abs(value) < 0.05 ? "0" : value.toFixed(1).replace(".", ",")} önceki döneme göre`;
}

function dayLabel(value: string, days: AnalyticsRange) {
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00Z`);
  if (days === 1) return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("tr-TR", days === 7 ? { weekday: "short" } : { day: "numeric", month: "short" }).format(date);
}

function pageHref(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export function AnalyticsDashboard({ analytics, range, missingEnv = [] }: { analytics: AnalyticsData | null; range: AnalyticsRange; missingEnv?: string[] }) {
  const [openList, setOpenList] = useState<"sources" | "pages" | "countries" | null>(null);
  const ranges: { days: AnalyticsRange; label: string; href: string }[] = [
    { days: 1, label: "24 saat", href: "/istatistik?aralik=1" },
    { days: 7, label: "7 gün", href: "/istatistik?aralik=7" },
    { days: 30, label: "30 gün", href: "/istatistik" },
    { days: 365, label: "12 ay", href: "/istatistik?aralik=all" },
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
  const periodAverage = range === 1 ? analytics.pageviews / 24 : analytics.pageviews / range;
  const refreshed = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(analytics.updatedAt));
  const periodLabel = range === 365 ? "Son 12 ay" : range === 1 ? "Son 24 saat" : `Son ${range} gün`;
  const metrics = [
    { label: "Görüntüleme", value: number.format(analytics.pageviews), note: changeLabel(analytics.pageviewsChange), icon: Eye },
    { label: "Ziyaretçi", value: number.format(analytics.visitors), note: changeLabel(analytics.visitorsChange), icon: Users },
    { label: "Ziyaretçi başına", value: pagePerVisitor.toFixed(1).replace(".", ","), note: "sayfa görüntüleme", icon: Gauge },
    { label: range === 1 ? "Saatlik ortalama" : "Günlük ortalama", value: number.format(Math.round(periodAverage)), note: "görüntüleme", icon: Activity },
  ];

  return <div className="xl:flex xl:h-[calc(100dvh-130px)] xl:min-h-0 xl:flex-col xl:overflow-hidden">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:mb-4">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-accent">{periodLabel}</p>
        <p className="mt-1 text-[13px] font-medium text-muted">Veriler {refreshed} itibarıyla güncellendi</p>
      </div>
      <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-full bg-surface-2 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{ranges.map((item) => <Link key={item.days} href={item.href} className={cn(buttonVariants({ variant: item.days === range ? "primary" : "ghost", size: "sm" }), "whitespace-nowrap")}>{item.label}</Link>)}</div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:gap-4">
      {metrics.map(({ label, value, note, icon: Icon }) => <Card key={label} className="flex min-h-[126px] flex-col justify-between overflow-hidden xl:min-h-0 xl:p-5">
        <div className="flex items-center justify-between gap-3"><strong className="text-[13px] font-semibold text-ink-2">{label}</strong><span className="grid size-8 place-items-center rounded-full bg-surface-2 text-accent"><Icon className="size-4" aria-hidden="true" /></span></div>
        <div className="mt-5"><span className="block text-[36px] font-bold leading-none tracking-[-.055em] xl:text-[31px]">{value}</span><small className="mt-2 block truncate text-[11px] font-medium text-muted">{note}</small></div>
      </Card>)}
    </div>

    <div className="mt-5 grid gap-5 xl:mt-4 xl:min-h-0 xl:flex-1 xl:grid-cols-12 xl:grid-rows-2 xl:gap-4">
      <Card className="xl:col-span-8 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <div className="flex items-center justify-between gap-4"><h2 className="text-[18px] font-bold tracking-[-.025em]">{range === 1 ? "Saatlik görüntüleme" : "Günlük görüntüleme"}</h2><span className="text-[12px] font-medium text-muted">{periodLabel}</span></div>
        <div className="mt-8 flex h-[270px] gap-3 xl:mt-4 xl:h-[140px]">
          <div className="flex w-10 shrink-0 flex-col justify-between pb-7 text-right text-xs font-medium tabular-nums text-muted">{yTicks.map((tick) => <span key={tick}>{number.format(tick)}</span>)}</div>
          <div className="min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative flex h-full items-end gap-1.5 border-b border-line-strong" style={{ minWidth: range === 365 ? 2200 : range === 30 ? 760 : "100%" }}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 grid h-[calc(100%-28px)] grid-rows-4"><span className="border-t border-line" /><span className="border-t border-line" /><span className="border-t border-line" /><span className="border-y border-line" /></div>
              {analytics.daily.map((day, index) => {
                const height = day.pageviews === 0 ? 2 : Math.max((day.pageviews / yMax) * 100, 4);
                const showLabel = range === 7 || index % (range === 365 ? 30 : range === 1 ? 3 : 5) === 0 || index === analytics.daily.length - 1;
                return <div key={day.date} className="group relative z-[1] flex h-[calc(100%-28px)] min-w-0 flex-1 items-end" title={`${dayLabel(day.date, range)}: ${number.format(day.pageviews)} görüntüleme, ${number.format(day.visitors)} okur`}>
                  <span className="relative w-full rounded-t bg-accent transition-opacity group-hover:opacity-70" style={{ height: `${height}%` }}><span className={cn("absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold tabular-nums text-ink", !showLabel && "sr-only")}>{number.format(day.pageviews)}</span></span>
                  <span className={cn("absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted", !showLabel && "sr-only")}>{dayLabel(day.date, range)}</span>
                </div>;
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="xl:col-span-4 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <h2 className="text-[18px] font-bold tracking-[-.025em]">Trafik kaynakları</h2>
        <div className="mt-4 space-y-2">{analytics.sources.slice(0, 3).map((source) => <div key={source.label}><div className="mb-1 flex justify-between gap-3 text-sm font-semibold"><span className="truncate">{source.label}</span><span>%{Math.round(source.percentage)}</span></div><div className="h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, Math.max(source.percentage, 1))}%` }} /></div></div>)}</div>
        {!analytics.sources.length ? <p className="mt-4 text-sm text-muted">Bu dönem için kaynak verisi yok.</p> : null}
        {analytics.sources.length > 3 ? <button type="button" onClick={() => setOpenList("sources")} className="mt-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent hover:text-accent">Tümünü göster</button> : null}
      </Card>

      <Card className="xl:col-span-8 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <div className="flex items-center justify-between gap-4"><h2 className="text-[18px] font-bold tracking-[-.025em]">En çok ziyaret edilenler</h2><span className="text-[12px] font-medium text-muted">{periodLabel}</span></div>
        <div className="mt-3 divide-y divide-line">{analytics.topPages.slice(0, 3).map((page, index) => <Link key={page.path} href={pageHref(page.path)} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[32px_minmax(0,1fr)_72px] gap-2 rounded-lg py-1.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:grid-cols-[36px_minmax(0,1fr)_80px_90px] sm:gap-3"><span className="font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span><strong className="truncate underline decoration-line-strong underline-offset-4">{page.path === "/" ? "Ana sayfa" : page.path}</strong><span className="hidden text-right text-muted sm:block">{number.format(page.visitors)} okur</span><span className="text-right font-semibold">{number.format(page.pageviews)}</span></Link>)}</div>
        {!analytics.topPages.length ? <p className="mt-4 text-sm text-muted">Bu dönem için sayfa verisi yok.</p> : null}
        {analytics.topPages.length > 3 ? <button type="button" onClick={() => setOpenList("pages")} className="mt-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent hover:text-accent">Tümünü göster</button> : null}
      </Card>

      <Card className="xl:col-span-4 xl:min-h-0 xl:overflow-hidden xl:p-5">
        <h2 className="text-[18px] font-bold tracking-[-.025em]">Okur dağılımı</h2>
        <div className="mt-4 space-y-2">{analytics.countries.slice(0, 3).map((country) => <div key={country.code} className="flex items-center justify-between"><span className="font-semibold">{country.label}</span><span className="text-muted">%{Math.round(country.percentage)}</span></div>)}</div>
        {!analytics.countries.length ? <p className="mt-4 text-sm text-muted">Bu dönem için ülke verisi yok.</p> : null}
        {analytics.countries.length > 3 ? <button type="button" onClick={() => setOpenList("countries")} className="mt-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent hover:text-accent">Tümünü göster</button> : null}
      </Card>
    </div>

    {openList && (
      <AnalyticsDialog
        title={openList === "sources" ? "Trafik kaynakları" : openList === "pages" ? "En çok ziyaret edilenler" : "Okur dağılımı"}
        onClose={() => setOpenList(null)}
        panelClassName="max-h-[88dvh] !max-w-[760px] overflow-hidden"
      >
        <div className="mt-5 max-h-[60dvh] overflow-y-auto pr-2">
          {openList === "sources" && <div className="space-y-4">{analytics.sources.map((source) => <div key={source.label}><div className="mb-2 flex justify-between gap-3 text-sm font-semibold"><span className="truncate">{source.label}</span><span>{number.format(source.visitors)} okur · %{Math.round(source.percentage)}</span></div><div className="h-2 rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, Math.max(source.percentage, 1))}%` }} /></div></div>)}</div>}
          {openList === "pages" && <div className="divide-y divide-line">{analytics.topPages.map((page, index) => <Link key={page.path} href={pageHref(page.path)} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[36px_minmax(0,1fr)_90px_100px] gap-3 rounded-lg py-3 text-sm transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"><span className="font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span><strong className="truncate underline decoration-line-strong underline-offset-4">{page.path === "/" ? "Ana sayfa" : page.path}</strong><span className="text-right text-muted">{number.format(page.visitors)} okur</span><span className="text-right font-semibold">{number.format(page.pageviews)} görüntüleme</span></Link>)}</div>}
          {openList === "countries" && <div className="divide-y divide-line">{analytics.countries.map((country) => <div key={country.code} className="flex items-center justify-between gap-4 py-3"><span className="font-semibold">{country.label}</span><span className="text-muted">{number.format(country.visitors)} okur · %{Math.round(country.percentage)}</span></div>)}</div>}
        </div>
      </AnalyticsDialog>
    )}
  </div>;
}
