import { Skeleton } from "@/components/feedback/states";
import { PageHeaderSkeleton, StatCardsSkeleton, TableRowsSkeleton } from "@/components/feedback/skeletons";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";
import { VisitorShellSkeleton } from "@/components/layout/visitor-shell-skeleton";

/**
 * One skeleton per route — admin and visitor alike — each shaped like the page it stands in for.
 *
 * They all live here rather than next to their features because they only exist to be imported by a
 * three-line `loading.tsx`, and because keeping them together is what stops one of them drifting out
 * of step with the layout primitives in `skeletons.tsx`.
 *
 * Every one of them wraps `ShellSkeleton`: the sidebar is rendered by each page's `AppShell`, not by
 * the dashboard layout, so a fallback without it would drop the sidebar for the whole load and shove
 * the content 248px sideways when it arrived.
 */

function Field({ height = "h-12" }: { height?: string }) {
  return (
    <div>
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className={`${height} w-full rounded-field`} />
    </div>
  );
}

/* ---------------------------------------------------------------------- /rss */

export function RssPageLoading() {
  return (
    <ShellSkeleton active="/rss">
      <div role="status" aria-label="RSS kaynakları yükleniyor">
        <PageHeaderSkeleton />
        <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="card space-y-5">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-12 w-full rounded-field" />
            <div className="space-y-1">
              {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-11 w-full rounded-chip" />)}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <Skeleton className="h-11 w-48 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
            <div className="mt-5 divide-y divide-line">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="flex gap-4 py-5 first:pt-0">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-5 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /dashboard */

export function DashboardLoading() {
  return (
    <ShellSkeleton active="/dashboard">
      <div role="status" aria-label="Panel yükleniyor">
        <PageHeaderSkeleton actionWidth="w-36" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-12">
          <div className="card flex min-h-[300px] flex-col justify-between xl:col-span-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-24 w-24" />
          </div>
          <div className="card min-h-[300px] xl:col-span-3">
            <Skeleton className="h-7 w-full" />
            <div className="mt-7 grid grid-cols-7 gap-3">
              {Array.from({ length: 28 }, (_, index) => <Skeleton key={index} className="size-[13px] rounded-full" />)}
            </div>
            <Skeleton className="mt-8 h-4 w-3/4" />
          </div>
          <div className="card min-h-[300px] xl:col-span-5">
            <Skeleton className="h-7 w-40" />
            <div className="mt-6 space-y-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index}><Skeleton className="h-4 w-4/5" /><Skeleton className="mt-2 h-3 w-1/3" /></div>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-1">
            {[0, 1].map((index) => (
              <div key={index} className="card flex min-h-[140px] flex-col justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
          <div className="card xl:col-span-5">
            <Skeleton className="h-7 w-40" />
            <div className="mt-6 grid grid-cols-7 gap-y-4">
              {Array.from({ length: 35 }, (_, index) => <Skeleton key={index} className="mx-auto size-8 rounded-full" />)}
            </div>
          </div>
          <div className="card xl:col-span-7">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-4 h-10 w-32" />
            <div className="mt-8 flex h-24 items-end gap-2">
              {[60, 80, 45, 95, 55, 70, 40].map((height, index) => (
                <Skeleton key={index} className="flex-1 rounded" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /yazilar */

export function PostsPageLoading() {
  return (
    <ShellSkeleton active="/yazilar">
      <div className="mx-auto w-full max-w-[1600px]" role="status" aria-label="Yazılar yükleniyor">
        <PageHeaderSkeleton actionWidth="w-36" />
        <StatCardsSkeleton count={3} className="mb-5 grid grid-cols-2 gap-5 sm:grid-cols-3" />
        <div className="card">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-12 w-full max-w-md rounded-field" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-44 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
          <TableRowsSkeleton rows={5} withBody />
          <div className="mt-5 flex justify-center border-t border-line pt-5"><Skeleton className="h-4 w-40" /></div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /e-bulten */

export function NewsletterPageLoading() {
  return (
    <ShellSkeleton active="/e-bulten">
      <div className="mx-auto w-full max-w-[1600px]" role="status" aria-label="E-bülten yükleniyor">
        <PageHeaderSkeleton actionWidth="w-40" />
        <StatCardsSkeleton count={4} className="grid grid-cols-2 gap-5 lg:grid-cols-4" />
        <div className="mt-5 grid gap-5 xl:grid-cols-12">
          <div className="card xl:col-span-7">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-4 h-7 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <div className="mt-10 grid grid-cols-2 gap-4 border-y border-line py-5">
              <div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-4 w-24" /></div>
              <div><Skeleton className="h-3 w-28" /><Skeleton className="mt-2 h-4 w-32" /></div>
            </div>
          </div>
          <div className="card xl:col-span-5">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="mt-5 h-11 w-28" />
            <div className="mt-8 flex h-28 items-end gap-3">
              {[70, 45, 85, 55, 65, 40].map((height, index) => (
                <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <Skeleton className="w-full" style={{ height: `${height}%` }} />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="card xl:col-span-12"><Skeleton className="mb-5 h-7 w-32" /><TableRowsSkeleton rows={4} /></div>
          <div className="card xl:col-span-12"><Skeleton className="mb-5 h-7 w-32" /><TableRowsSkeleton rows={3} /></div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /istatistik */

export function AnalyticsPageLoading() {
  return (
    <ShellSkeleton active="/istatistik">
      <div role="status" aria-label="İstatistikler yükleniyor">
        <PageHeaderSkeleton />
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Skeleton className="h-5 w-80 max-w-full" />
          <div className="flex gap-2"><Skeleton className="h-9 w-20 rounded-full" /><Skeleton className="h-9 w-20 rounded-full" /></div>
        </div>
        <StatCardsSkeleton count={4} className="grid grid-cols-2 gap-5 lg:grid-cols-4" />
        <div className="mt-5 grid gap-5 xl:grid-cols-12">
          <div className="card xl:col-span-8">
            <Skeleton className="h-7 w-48" />
            <div className="mt-8 flex h-[270px] items-end gap-1.5">
              {[55, 72, 40, 88, 61, 35, 79, 50, 66, 44, 82, 58].map((height, index) => (
                <Skeleton key={index} className="flex-1 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="card xl:col-span-4">
            <Skeleton className="h-7 w-40" />
            <div className="mt-7 space-y-5">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index}><Skeleton className="mb-2 h-4 w-full" /><Skeleton className="h-2 w-full rounded-full" /></div>
              ))}
            </div>
          </div>
          <div className="card xl:col-span-8"><Skeleton className="h-7 w-56" /><TableRowsSkeleton rows={5} /></div>
          <div className="card xl:col-span-4">
            <Skeleton className="h-7 w-40" />
            <div className="mt-7 space-y-5">
              {[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-5 w-full" />)}
            </div>
          </div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /reklamlar */

export function AdsPageLoading() {
  return (
    <ShellSkeleton active="/reklamlar">
      <div role="status" aria-label="Reklamlar yükleniyor">
        <PageHeaderSkeleton actionWidth="w-40" />
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="card overflow-hidden p-0">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-5 sm:p-6">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="mt-3 h-6 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-28 rounded-field" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ------------------------------------------------------- /reklamlar/yeni */

export function AdFormLoading() {
  return (
    <ShellSkeleton active="/reklamlar">
      <div role="status" aria-label="Reklam formu yükleniyor">
        <PageHeaderSkeleton actionWidth="w-44" />
        <div className="w-full">
          <div className="card space-y-5">
            <div><Skeleton className="h-7 w-40" /><Skeleton className="mt-2 h-4 w-full" /></div>
            <Field />
            <Field height="h-28" />
            <div className="grid gap-4 sm:grid-cols-2"><Field /><Field /></div>
            <Field />
            <div><Skeleton className="mb-2 h-4 w-28" /><Skeleton className="h-28 w-full rounded-field" /></div>
            <Skeleton className="h-20 w-full rounded-field" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2"><Skeleton className="h-11 rounded-full" /><Skeleton className="h-11 rounded-full" /></div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /profil */

export function ProfilePageLoading() {
  return (
    <ShellSkeleton active="/profil">
      <div role="status" aria-label="Profil yükleniyor">
        <PageHeaderSkeleton />
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="card xl:col-span-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Skeleton className="size-24 shrink-0 rounded-card" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="mt-3 h-4 w-48" />
                <Skeleton className="mt-3 h-3 w-64" />
              </div>
            </div>
            <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-field bg-surface-2 p-4">
                  <Skeleton className="mb-5 size-5" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5 xl:col-span-4">
            <div className="card space-y-5"><Skeleton className="h-7 w-40" /><Field /><Field /><Skeleton className="h-11 w-full rounded-full" /></div>
            <div className="card"><Skeleton className="h-7 w-24" /><div className="mt-5 space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div></div>
            <div className="card"><Skeleton className="h-6 w-24" /><Skeleton className="mt-2 h-3 w-full" /><Skeleton className="mt-5 h-11 w-full rounded-full" /></div>
          </div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ---------------------------------------------------------------- /ayarlar */

export function SettingsIndexLoading() {
  return (
    <ShellSkeleton active="/ayarlar">
      <div className="mx-auto w-full max-w-[1200px]" role="status" aria-label="Ayarlar yükleniyor">
        <PageHeaderSkeleton />
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex min-h-32 items-center gap-5 rounded-card border border-ink/[0.05] bg-surface p-6">
              <Skeleton className="size-14 shrink-0 rounded-panel" />
              <div className="min-w-0 flex-1"><Skeleton className="h-5 w-32" /><Skeleton className="mt-2 h-4 w-full" /></div>
            </div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}

/**
 * Only the form: `ayarlar/(sections)/layout.tsx` keeps the shell, heading and tab strip mounted
 * across tab changes, so a fallback that redrew them would make the tabs flicker.
 */
export function SettingsSectionLoading() {
  return (
    <div className="w-full space-y-5" role="status" aria-label="Ayarlar yükleniyor">
      <div className="card space-y-5">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-5 sm:grid-cols-2"><Field /><Field /></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field height="h-28" /><Field height="h-28" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field height="h-36" /><Field height="h-36" /></div>
        <Field />
      </div>
      <div className="flex justify-end gap-2"><Skeleton className="h-11 w-24 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /></div>
    </div>
  );
}

/* ------------------------------------------------- editors: post / newsletter */

/** `/yazilar/yeni`, `/yazilar/[id]/duzenle` and `/e-bulten/yeni` all use the 1fr + 360px form grid. */
export function EditorLoading({ active, asideFields }: { active: string; asideFields: number }) {
  return (
    <ShellSkeleton active={active}>
      <div role="status" aria-label="Form yükleniyor">
        <PageHeaderSkeleton />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="card space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-13 w-full rounded-field sm:w-64" />
            </div>
            <Field />
            <Field height="h-28" />
            <div><Skeleton className="mb-2 h-4 w-28" /><Skeleton className="h-[360px] w-full rounded-field" /></div>
          </div>
          <aside className="space-y-5">
            <div className="card space-y-5">
              <Skeleton className="h-7 w-24" />
              {Array.from({ length: asideFields }, (_, index) => <Field key={index} />)}
              <div className="grid grid-cols-2 gap-2"><Skeleton className="h-11 rounded-full" /><Skeleton className="h-11 rounded-full" /></div>
            </div>
          </aside>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* --------------------------------------------------------------- visitor */

/**
 * The visitor skeletons stand in for pages that are rendered per request against Supabase, so they
 * are what a reader actually looks at while a note or a search is being fetched. They deliberately
 * carry no text: a fallback cannot know the language of the page it is covering.
 */

/** The note card as the feed and the search results draw it: three lines of copy over a meta row. */
export function VisitorNoteCardsSkeleton({ count, withCount }: { count: number; withCount?: boolean }) {
  return (
    <>
      {withCount ? <Skeleton className="mb-4 ml-1 h-3 w-32" /> : null}
      <div className="flex flex-col gap-4 sm:gap-5">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="rounded-panel border border-transparent bg-surface p-5 sm:p-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="mt-2.5 h-5 w-11/12" />
            <Skeleton className="mt-2.5 h-5 w-2/3" />
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <div className="flex items-center gap-2.5"><Skeleton className="size-7 rounded-[9px]" /><Skeleton className="h-3.5 w-24" /></div>
              <Skeleton className="size-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------- / */

export function VisitorFeedLoading() {
  return (
    <VisitorShellSkeleton label="Akış yükleniyor" liveBand>
      {/* The brief keeps its washed, full-bleed band: it is the first thing a reader sees, and a
          plain grey block there would not look like the page that is coming. */}
      <div className="daily-brief -mx-5 w-[calc(100%+2.5rem)] px-5">
        <div className="mx-auto w-full max-w-[720px] px-1 pb-9 pt-12 sm:pb-11 sm:pt-16">
          <Skeleton className="h-6 w-44" />
          <div className="mt-5 space-y-3">
            {["w-full", "w-full", "w-3/4"].map((width, index) => <Skeleton key={index} className={`h-5 ${width}`} />)}
          </div>
          <Skeleton className="mt-5 h-4 w-20" />
        </div>
      </div>
      <div className="mt-2 w-full max-w-[720px] sm:mt-3">
        <Skeleton className="mb-5 h-8 w-44 rounded-full" />
        <VisitorNoteCardsSkeleton count={4} />
      </div>
    </VisitorShellSkeleton>
  );
}

/* ------------------------------------------------------------- /search */

export function VisitorSearchLoading() {
  return (
    <VisitorShellSkeleton label="Arama yükleniyor">
      <div className="w-full max-w-[720px] pt-12 sm:pt-16">
        <div className="px-1 pb-7"><Skeleton className="h-10 w-40" /><Skeleton className="mt-4 h-4 w-80 max-w-full" /></div>
        <Skeleton className="h-[62px] w-full rounded-full" />
        <div className="pt-9"><VisitorNoteCardsSkeleton count={3} withCount /></div>
      </div>
    </VisitorShellSkeleton>
  );
}

/* -------------------------------------------------------- /haber/[id] */

export function VisitorArticleLoading() {
  return (
    <VisitorShellSkeleton label="Haber yükleniyor">
      <div className="w-full max-w-[720px] pt-8 sm:pt-10">
        <div className="rounded-panel border border-line bg-surface p-6 sm:p-10">
          <div className="mb-8 flex items-center justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="size-10 rounded-full" /></div>
          <Skeleton className="h-8 w-3/4" />
          <div className="mt-6 space-y-3">
            {["w-full", "w-full", "w-11/12", "w-full", "w-4/5"].map((width, index) => <Skeleton key={index} className={`h-5 ${width}`} />)}
          </div>
          <div className="mt-9 flex items-center justify-between border-t border-line pt-5"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-32" /></div>
        </div>
      </div>
    </VisitorShellSkeleton>
  );
}

/* ---------------------------------- /about, /contact, /newsletter */

/** `VisitorContentPage`: a titled header panel over a body of running text. */
export function VisitorContentLoading({ label, lines = 5 }: { label: string; lines?: number }) {
  const widths = ["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-3/4"];
  return (
    <VisitorShellSkeleton label={label}>
      <div className="w-full max-w-[720px] pb-6 pt-12 sm:pt-16">
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <div className="border-b border-line px-6 py-8 sm:px-10 sm:py-10"><Skeleton className="h-10 w-52" /><Skeleton className="mt-4 h-4 w-4/5" /></div>
          <div className="space-y-3 px-6 py-8 sm:px-10 sm:py-10">
            <Skeleton className="mb-6 h-3 w-28" />
            {Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={`h-5 ${widths[index % widths.length]}`} />)}
          </div>
        </div>
      </div>
    </VisitorShellSkeleton>
  );
}

/* ----------------------------------------------------------- /settings */

/** The reader's own page settings: one row per preference, each a label beside a segmented control. */
export function VisitorSettingsLoading() {
  return (
    <VisitorShellSkeleton label="Sayfa ayarları yükleniyor">
      <div className="w-full max-w-[720px] pt-12 sm:pt-16">
        <div className="rounded-panel border border-line bg-surface p-6 sm:p-10">
          <Skeleton className="h-10 w-56" />
          <div className="mt-8 divide-y divide-line">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex flex-col gap-3 py-6 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1"><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-3 w-64 max-w-full" /></div>
                <Skeleton className="h-11 w-full rounded-full sm:w-64" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </VisitorShellSkeleton>
  );
}

/* --------------------------------------- (auth) and the newsletter opt-in */

/** `AuthShell` is a single centred card, so its fallback is one too. */
export function AuthPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10" role="status" aria-label="Sayfa yükleniyor">
      <section className="w-full max-w-[460px] rounded-card bg-white p-7 shadow-sm sm:p-10">
        <div className="mb-10 flex items-center gap-3"><Skeleton className="size-8 rounded-[11px]" /><Skeleton className="h-5 w-24" /></div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mb-8 mt-3 h-4 w-full" />
        <div className="space-y-4"><Skeleton className="h-12 w-full rounded-field" /><Skeleton className="h-12 w-full rounded-field" /><Skeleton className="h-12 w-full rounded-full" /></div>
      </section>
    </main>
  );
}
