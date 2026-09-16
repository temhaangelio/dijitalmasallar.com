import Link from "next/link";
import { ArrowRight, AudioLines, Check, Mail, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import type { DashboardPostStats } from "@/services/posts";

/** One day's two standing jobs: the day's recording, and the letter that goes out about it. */
export type DailyRoutine = {
  day: string;
  label: string;
  /** "Bugün" / "Dün", where the day has one. */
  relative: string | null;
  notes: number;
  audio: { tr: boolean; en: boolean };
  issue: { tr: boolean; en: boolean };
};

/** `16 Eylül 2026`, with the year kept back for wider screens — on a phone it costs a whole line. */
function DayLabel({ label }: { label: string }) {
  const parts = label.split(" ");
  const year = parts.length > 2 ? parts.pop() : null;
  return <>{parts.join(" ")}{year ? <span className="hidden sm:inline"> {year}</span> : null}</>;
}

/**
 * Whether one job is done, in both languages — one cell of the table.
 *
 * Two marks rather than one: the recording and the bulletin are each made twice, and a day that went
 * out in Turkish but not in English is exactly the state worth seeing from here — a single tick
 * would call that day finished. The whole cell is the link to the page where the missing half is
 * made, so the target is a row's worth of pointer rather than a word.
 */
function RoutineState({ href, icon, label, state, empty, open }: { href: string; icon: React.ReactNode; label: string; state: { tr: boolean; en: boolean }; empty: boolean; open: boolean }) {
  const done = state.tr && state.en;
  const none = !state.tr && !state.en;
  /*
   * Grey is "nothing to do or not due yet" — an empty day, or today, which is still being lived.
   * Amber is the one state worth catching from here: a finished day that had notes and did not get
   * its recording or its letter, or got only one of the two languages.
   */
  const pending = empty || (none && open);
  const tone = done ? "text-success" : pending ? "text-muted" : "text-warning";
  const reading = empty ? "not yok" : done ? "TR + EN" : none ? (open ? "henüz yok" : "eksik") : state.tr ? "yalnızca TR" : "yalnızca EN";

  return (
    <Link href={href} title={`${label}: ${reading}`} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg py-1 text-[12px] hover:underline hover:underline-offset-2">
      <span className={`shrink-0 ${done ? "text-success" : pending ? "text-faint" : "text-warning"}`}>
        {done ? <Check size={14} aria-hidden="true" /> : pending ? <Minus size={14} aria-hidden="true" /> : icon}
      </span>
      <span className={`font-semibold ${tone}`}>{reading}</span>
    </Link>
  );
}

/**
 * The standing daily jobs, for the last few days.
 *
 * A table, because that is what it is: the same two questions asked of every day, and the answers
 * only mean something read down the column — three days of "eksik" under one heading is a habit
 * slipping, which three separate cards would never show.
 *
 * The panel could already answer "did yesterday go out?", but only by opening two other pages and
 * reading a list on each. It is the first thing anyone wants to know on opening the panel in the
 * morning, so it is answered here, and each cell links to the page where the missing one is made.
 */
function DailyRoutineCard({ routine }: { routine: DailyRoutine[] }) {
  return (
    <Card className="mb-5 !p-0">
      <div className="border-b border-line px-4 py-4 sm:px-6">
        <h2 className="section-title">Günlük durum</h2>
      </div>
      {/* The four columns fit a phone at their narrow widths; the scroll container is the guard for
          anything narrower still, where a table would otherwise push the page sideways. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-left">
          {/* The slack belongs to the last column: left to the day, it pushed the three answers
              apart and the columns stopped reading as columns. */}
          <colgroup><col className="w-[108px] sm:w-48" /><col className="w-9 sm:w-14" /><col className="w-[86px] sm:w-44" /><col /></colgroup>
          <thead>
            <tr className="border-b border-line text-[11px] text-muted">
              <th scope="col" className="px-4 py-2 font-medium sm:px-6">Gün</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium sm:px-3">Not</th>
              <th scope="col" className="px-1.5 py-2 font-medium sm:px-3">Sesli özet</th>
              <th scope="col" className="px-4 py-2 font-medium sm:px-6">Bülten</th>
            </tr>
          </thead>
          <tbody>
            {routine.map((entry) => (
              <tr key={entry.day} className="border-b border-line last:border-b-0">
                <th scope="row" className="px-4 py-2.5 text-[13px] font-normal sm:px-6">
                  <span className="block font-semibold text-ink">{entry.relative ?? <DayLabel label={entry.label} />}</span>
                  {entry.relative ? <span className="block text-[11px] text-muted"><DayLabel label={entry.label} /></span> : null}
                </th>
                <td className="px-1.5 py-2.5 text-right text-[13px] tabular-nums text-muted sm:px-3">{entry.notes}</td>
                <td className="px-1.5 py-2.5 sm:px-3">
                  <RoutineState href="/gunun-ozeti" icon={<AudioLines size={14} aria-hidden="true" />} label="Sesli özet" state={entry.audio} empty={!entry.notes} open={entry.relative === "Bugün"} />
                </td>
                <td className="px-4 py-2.5 sm:px-6">
                  <RoutineState href="/bulten" icon={<Mail size={14} aria-hidden="true" />} label="Bülten" state={entry.issue} empty={!entry.notes} open={entry.relative === "Bugün"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * The overview's body, split from the route so it can be rendered against sample data — the panel
 * is behind a login, and a page you cannot open is a page you cannot look at while designing it.
 * The route keeps the data fetching and the analytics card, which streams in on its own.
 */
export function DashboardOverview({ stats, today, routine, viewsSlot }: { stats: DashboardPostStats; today: Date; routine: DailyRoutine[]; viewsSlot: React.ReactNode }) {
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

      {routine.length ? <DailyRoutineCard routine={routine} /> : null}

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
