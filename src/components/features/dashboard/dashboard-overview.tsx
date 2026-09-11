import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import type { DashboardPostStats } from "@/services/posts";

/**
 * The overview's body, split from the route so it can be rendered against sample data — the panel
 * is behind a login, and a page you cannot open is a page you cannot look at while designing it.
 * The route keeps the data fetching and the analytics card, which streams in on its own.
 */
export function DashboardOverview({ stats, today, viewsSlot }: { stats: DashboardPostStats; today: Date; viewsSlot: React.ReactNode }) {
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(today);
  const [year, month, day] = key.split("-").map(Number);
  const monthName = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" }).format(today);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const published = new Set(stats.publishedDaysThisMonth);
  const next = stats.scheduled[0];

  return (
    <>
      {/*
        * Three counts of the same thing, read together — so one surface with hairlines between the
        * columns, rather than three boxes with three borders and three shadows arguing for equal
        * attention. It is also the site's own idiom: a rule, not a frame.
        */}
      <Card className="mb-5 !p-0">
        <div className="grid grid-cols-3 divide-x divide-line">
          {[["Bu hafta", stats.publishedThisWeek], ["Bu ay", stats.publishedThisMonth], ["Planlı", stats.scheduledTotal]].map(([label, value]) => (
            <div key={label} className="px-4 py-4 sm:px-5">
              <p className="text-[11px] text-muted">{label}</p>
              <strong className="mt-1.5 block text-[26px] font-medium leading-none tabular-nums tracking-tight sm:text-[30px]">{Number(value).toLocaleString("tr-TR")}</strong>
            </div>
          ))}
        </div>
      </Card>

      {/* Shared grid rows keep related cards aligned even when their content lengths differ. */}
      <div className="admin-overview-grid grid items-stretch gap-5 xl:grid-cols-2">
        <Card>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="section-title">Son notlar</h2>
            <Link href="/yazilar" className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">Tümü · {stats.total.toLocaleString("tr-TR")}<ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <div className="divide-y divide-line">
            {stats.recent.length ? stats.recent.map((post) => (
              <Link prefetch={false} href={`/yazilar/${post.id}/duzenle`} key={post.id} className="group block rounded-lg py-3">
                <time dateTime={post.created_at} className="text-[11px] tabular-nums text-muted">{fullDateLabel(post.created_at, "tr")} · {timeLabel(post.created_at, "tr")}</time>
                <h3 className="mt-1 line-clamp-2 font-[family-name:var(--font-visitor-sans)] text-[21px] leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{post.title}</h3>
              </Link>
            )) : <p className="py-10 text-sm text-muted">Henüz yayımlanmış not bulunmuyor.</p>}
          </div>
        </Card>
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="section-title capitalize">{monthName}</h2>
              <span className="text-[11px] text-muted">{published.size} yayın günü</span>
            </div>
            <div className="mt-4 grid w-full grid-cols-7 gap-y-2 text-center">
              {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"].map((label) => <span key={label} className="pb-1.5 text-[10px] font-medium text-faint">{label}</span>)}
              {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
              {Array.from({ length: days }, (_, index) => (
                <span
                  key={index}
                  title={`${index + 1} ${monthName}${published.has(index + 1) ? " · Yayın var" : ""}`}
                  aria-current={index + 1 === day ? "date" : undefined}
                  className={`mx-auto grid size-8 sm:size-10 place-items-center rounded-full text-[11px] tabular-nums ${published.has(index + 1) ? "bg-ink font-medium text-ink-contrast" : "text-muted"} ${index + 1 === day ? "ring-1 ring-line-strong ring-offset-2 ring-offset-surface" : ""}`}
                >
                  {index + 1}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-faint">Dolu günlerde en az bir not yayımlandı.</p>
          </Card>

          {viewsSlot}
          <Card>
            <h2 className="section-title">Sıradaki yayın</h2>
            {next ? (
              <Link prefetch={false} href={`/yazilar/${next.id}/duzenle`} className="group mt-3 block rounded-lg">
                <time dateTime={next.created_at} className="text-[11px] tabular-nums text-muted">{fullDateLabel(next.created_at, "tr")} · {timeLabel(next.created_at, "tr")}</time>
                <p className="mt-1 line-clamp-2 font-[family-name:var(--font-visitor-sans)] text-[21px] leading-snug group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{next.title}</p>
              </Link>
            ) : <p className="mt-3 text-sm leading-6 text-muted">Planlanmış bir not bulunmuyor.</p>}
          </Card>
      </div>
    </>
  );
}
