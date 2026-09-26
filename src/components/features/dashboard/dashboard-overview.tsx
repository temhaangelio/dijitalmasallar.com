import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import type { AnalyticsData } from "@/services/analytics";
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
 * Whether one job is done — one cell of the table.
 *
 * Two marks rather than a sentence. The state used to be written out ("TR + EN", "yalnızca TR",
 * "eksik", "henüz yok"): four phrasings for four states, read word by word and compared between
 * rows. A language either has its recording or it does not, so each is drawn as itself — TR and EN,
 * ticked or not — and a column of these reads as a pattern instead of as prose.
 *
 * The whole cell links to the page where the missing half is made.
 */
function RoutineState({ href, label, state, empty, open }: { href: string; label: string; state: { tr: boolean; en: boolean }; empty: boolean; open: boolean }) {
  /*
   * Grey is "nothing to do or not due yet" — a day with no notes, or today, which is still being
   * lived. Amber is the one state worth catching from here: a finished day that had notes and did
   * not get its recording or its letter.
   */
  const missingTone = empty || open ? "bg-surface-3 text-faint" : "bg-warning-surface text-warning";
  const reading = empty ? "o gün not yok" : (["tr", "en"] as const).map((language) => `${language.toUpperCase()}: ${state[language] ? "var" : "yok"}`).join(", ");

  return (
    <Link href={href} title={`${label} — ${reading}`} className="inline-flex items-center gap-1 rounded-full">
      {(["tr", "en"] as const).map((language) => (
        <span
          key={language}
          className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold tracking-wide ${state[language] ? "bg-success-surface text-success" : missingTone}`}
        >
          {state[language] ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : <Minus size={11} strokeWidth={3} aria-hidden="true" />}
          {language.toUpperCase()}
        </span>
      ))}
    </Link>
  );
}

/**
 * The overview's card frame: the same heading band on all four, so the titles sit on one line across
 * the grid and each card's detail (a count, a range) reads in the same corner. The body takes the
 * card's remaining height, so a card that is taller than its content spreads it rather than leaving
 * a blank bottom half.
 */
export function OverviewCard({ title, aside, flush = false, children }: { title: React.ReactNode; aside?: React.ReactNode; flush?: boolean; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col !p-0">
      <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <h2 className="section-title">{title}</h2>
        {aside ? <div className="shrink-0 text-[12px] tabular-nums text-muted">{aside}</div> : null}
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${flush ? "" : "px-4 py-4 sm:px-6"}`}>{children}</div>
    </Card>
  );
}

function AsideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex min-h-8 items-center gap-1 transition-colors hover:text-ink">{children}<ArrowRight size={13} aria-hidden="true" /></Link>;
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
    <OverviewCard title="Günlük durum" aside={`Son ${routine.length} gün`} flush>
      {/* Three columns fit a phone; the scroll container is the guard for anything narrower
          still, where a table would otherwise push the page sideways. The table takes the card's
          height, so its rows share any spare room instead of leaving it under the last one. */}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="h-full w-full min-w-[280px] border-collapse text-left">
          <thead>
            <tr className="h-9 border-b border-line text-[11px] text-muted">
              <th scope="col" className="px-4 font-medium sm:px-6">Gün</th>
              <th scope="col" className="px-2 font-medium sm:px-3">Sesli özet</th>
              <th scope="col" className="px-4 font-medium sm:px-6">Bülten</th>
            </tr>
          </thead>
          <tbody>
            {routine.map((entry) => (
              <tr key={entry.day} className="border-b border-line last:border-b-0">
                {/* The day takes the slack, so the two answers stay side by side however wide the
                    card gets — they are read across, not hunted for. */}
                <th scope="row" className="w-full px-4 py-2 text-[13px] font-normal sm:px-6">
                  <span className="block font-semibold text-ink">{entry.relative ?? <DayLabel label={entry.label} />}</span>
                  <span className="block text-[11px] text-muted">
                    {entry.relative ? <><DayLabel label={entry.label} /> · </> : null}{entry.notes} not
                  </span>
                </th>
                <td className="whitespace-nowrap px-2 py-2 sm:px-3">
                  <RoutineState href="/gunun-ozeti" label="Sesli özet" state={entry.audio} empty={!entry.notes} open={entry.relative === "Bugün"} />
                </td>
                <td className="whitespace-nowrap px-4 py-2 sm:px-6">
                  <RoutineState href="/bulten" label="Bülten" state={entry.issue} empty={!entry.notes} open={entry.relative === "Bugün"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OverviewCard>
  );
}

/**
 * The last week of readers: the total, then a bar per day filling the rest of the card. Today's bar
 * is in ink and the week behind it a shade lighter, so the one to read is the one that stands out.
 */
export function ReaderActivity({ analytics }: { analytics: AnalyticsData | null }) {
  const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: "Europe/Istanbul" });
  const max = Math.max(...(analytics?.daily.map((day) => day.pageviews) ?? [0]), 1);
  return (
    <OverviewCard title="Okur hareketi" aside={<AsideLink href="/istatistik">Son 7 gün</AsideLink>}>
      {analytics ? <>
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <strong className="text-[28px] font-medium leading-none tabular-nums tracking-tight">{analytics.pageviews.toLocaleString("tr-TR")}</strong>
          <span className="text-[12px] text-muted">görüntüleme · {analytics.visitors.toLocaleString("tr-TR")} ziyaretçi</span>
        </p>
        <div className="mt-4 flex min-h-24 flex-1 items-stretch gap-2" role="img" aria-label={`Son 7 günde ${analytics.pageviews} görüntüleme`}>
          {analytics.daily.map((day, index) => (
            <span key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="flex w-full flex-1 items-end justify-center"><span className={`w-full max-w-11 rounded-t-[4px] ${index === analytics.daily.length - 1 ? "bg-ink" : "bg-ink/25"}`} title={`${day.date}: ${day.pageviews.toLocaleString("tr-TR")}`} style={{ height: `${Math.max(day.pageviews / max * 100, 3)}%` }} /></span>
              <span className={`text-[10px] tabular-nums ${index === analytics.daily.length - 1 ? "font-semibold text-ink" : "text-faint"}`}>{weekday.format(new Date(`${day.date}T12:00:00+03:00`))}</span>
            </span>
          ))}
        </div>
      </> : <p className="text-sm leading-6 text-muted">İstatistik verisi şu anda alınamıyor. Yazılarınızı yönetmeye devam edebilirsiniz.</p>}
    </OverviewCard>
  );
}

/**
 * The three counts. Below 1280px they are a strip of their own above the cards; from 1280px they sit
 * in the page header instead, so the four cards can share the rest of the window equally.
 */
function countsOf(stats: DashboardPostStats): [string, number][] {
  return [["Bu hafta", stats.publishedThisWeek], ["Bu ay", stats.publishedThisMonth], ["Planlı", stats.scheduledTotal]];
}

export function OverviewCounts({ stats }: { stats: DashboardPostStats }) {
  return (
    <dl className="mr-3 hidden items-center divide-x divide-line xl:flex">
      {countsOf(stats).map(([label, value]) => (
        <div key={label} className="px-5 text-right last:pr-2">
          <dt className="text-[11px] text-muted">{label}</dt>
          <dd className="mt-1 text-[22px] font-medium leading-none tabular-nums tracking-tight">{value.toLocaleString("tr-TR")}</dd>
        </div>
      ))}
    </dl>
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

  return (
    <div className="overview-fit">
      {/*
        * Three counts of the same thing, read together — so one surface with hairlines between the
        * columns, rather than three boxes with three borders and three shadows arguing for equal
        * attention. It is also the site's own idiom: a rule, not a frame.
        */}
      <Card className="mb-5 !p-0 xl:hidden">
        <div className="grid grid-cols-3 divide-x divide-line">
          {countsOf(stats).map(([label, value]) => (
            <div key={label} className="px-4 py-4 sm:px-5">
              <p className="text-[11px] text-muted">{label}</p>
              <strong className="mt-1.5 block text-[26px] font-medium leading-none tabular-nums tracking-tight sm:text-[30px]">{Number(value).toLocaleString("tr-TR")}</strong>
            </div>
          ))}
        </div>
      </Card>

      {/* Four cards of one size: two columns, rows of equal height. From 1280px on a tall enough
          window the grid takes exactly the height left under the header (see `.overview-fit`). */}
      <div className="admin-overview-grid grid items-stretch gap-5 xl:auto-rows-fr xl:grid-cols-2">
        {routine.length ? <DailyRoutineCard routine={routine} /> : null}

        <OverviewCard title={<span className="capitalize">{monthName}</span>} aside={<span title="Dolu günlerde en az bir not yayımlandı.">{published.size} yayın günü</span>}>
          <div className="grid grid-cols-7 text-center">
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"].map((label) => <span key={label} className="pb-1.5 text-[10px] font-medium text-faint">{label}</span>)}
          </div>
          {/* The weeks share the card's height, so the month fills its card like the table does. */}
          <div className="grid flex-1 auto-rows-fr grid-cols-7 items-center gap-y-1 text-center">
            {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: days }, (_, index) => (
              <span
                key={index}
                title={`${index + 1} ${monthName}${published.has(index + 1) ? " · Yayın var" : ""}`}
                aria-current={index + 1 === day ? "date" : undefined}
                className={`overview-day mx-auto grid size-8 place-items-center rounded-full text-[11px] tabular-nums sm:size-9 xl:size-7 ${published.has(index + 1) ? "bg-ink font-medium text-ink-contrast" : index + 1 > day ? "text-faint" : "text-muted"} ${index + 1 === day ? "ring-1 ring-line-strong ring-offset-2 ring-offset-surface" : ""}`}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </OverviewCard>

        {viewsSlot}

        {/* The queue, not just its head: the next few notes, each with the moment it goes out. */}
        <OverviewCard title="Sıradaki yayınlar" aside={stats.scheduledTotal > stats.scheduled.length ? <AsideLink href="/yazilar">{stats.scheduledTotal} planlı</AsideLink> : stats.scheduledTotal ? `${stats.scheduledTotal} planlı` : null}>
          {stats.scheduled.length ? (
            <ul className="-my-2.5 divide-y divide-line">
              {stats.scheduled.map((post) => (
                <li key={post.id}>
                  <Link prefetch={false} href={`/yazilar/${post.id}/duzenle`} className="group block py-2.5">
                    <time dateTime={post.created_at} className="text-[11px] tabular-nums text-muted">{fullDateLabel(post.created_at, "tr")} · {timeLabel(post.created_at, "tr")}</time>
                    <p className="mt-0.5 line-clamp-2 font-[family-name:var(--font-visitor-sans)] text-[17px] xl:line-clamp-1 xl:text-[16px] leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{post.title || post.excerpt || "Başlıksız not"}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm leading-6 text-muted">Planlanmış bir not bulunmuyor.</p>}
        </OverviewCard>
      </div>
    </div>
  );
}
