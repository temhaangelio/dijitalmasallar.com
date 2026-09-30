import { Skeleton } from "@/components/feedback/states";
import { PageHeaderSkeleton, StatCardsSkeleton, TableRowsSkeleton } from "@/components/feedback/skeletons";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";

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
      <div className="w-full xl:flex xl:h-[calc(100dvh-72px)] xl:min-h-0 xl:flex-col" role="status" aria-label="RSS kaynakları yükleniyor">
        <PageHeaderSkeleton actionWidth="w-64" />
        <div className="grid items-start gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[248px_minmax(0,1fr)]">
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
  const cardHead = <div className="flex min-h-[60px] items-center justify-between border-b border-line px-4 sm:px-6"><Skeleton className="h-6 w-36" /><Skeleton className="h-3 w-16" /></div>;
  return <ShellSkeleton active="/dashboard"><div role="status" aria-label="Genel bakış yükleniyor" className="overview-fit">
    <PageHeaderSkeleton actionWidth="w-32" />
    <div className="card mb-5 !p-0 xl:hidden"><div className="grid grid-cols-3 divide-x divide-line">{[0, 1, 2].map(index => <div key={index} className="px-4 py-4 sm:px-5"><Skeleton className="h-3 w-14" /><Skeleton className="mt-2.5 h-7 w-12" /></div>)}</div></div>
    {/* Literal widths: Tailwind reads class names out of the source, so an interpolated one
        produces no CSS at all. */}
    <div className="admin-overview-grid grid items-stretch gap-5 xl:auto-rows-fr xl:grid-cols-2">
      <div className="card flex flex-col !p-0">{cardHead}{[0, 1, 2].map(index => (
        <div key={index} className="flex flex-1 items-center gap-6 border-t border-line px-4 py-3 sm:px-6">
          <div className="flex-1"><Skeleton className="h-3.5 w-14" /><Skeleton className="mt-1.5 h-3 w-24" /></div>
          <Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}</div>
      <div className="card flex flex-col !p-0">{cardHead}<div className="flex-1 px-4 py-4 sm:px-6"><Skeleton className="h-full min-h-40 w-full rounded-xl" /></div></div>
      <div className="card flex flex-col !p-0">{cardHead}<div className="flex flex-1 flex-col px-4 py-4 sm:px-6"><Skeleton className="h-7 w-32" /><Skeleton className="mt-4 min-h-24 w-full flex-1" /></div></div>
      <div className="card flex flex-col !p-0">{cardHead}<div className="px-4 py-2 sm:px-6">{[0, 1, 2].map(index => <div key={index} className="space-y-2 py-2.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-5 w-4/5" /></div>)}</div></div>
    </div>
  </div></ShellSkeleton>;
}

/* ---------------------------------------------------------------- /yazilar */

export function PostsPageLoading() {
  return (
    <ShellSkeleton active="/yazilar">
      <div className="mx-auto w-full max-w-[1600px]" role="status" aria-label="Yazılar yükleniyor">
        <PageHeaderSkeleton actionWidth="w-36" />
        <div className="card !p-0">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center">
            <div className="flex gap-2 lg:order-1"><Skeleton className="h-10 w-64 rounded-full" /><Skeleton className="h-10 w-36 rounded-full" /></div>
            <div className="flex gap-2 lg:order-2 lg:flex-1"><Skeleton className="h-11 flex-1 rounded-full" /><Skeleton className="size-11 shrink-0 rounded-full" /></div>
          </div>
          <div className="px-4 sm:px-5">
          <TableRowsSkeleton rows={3} withBody />
          </div>
          <div className="flex justify-center border-t border-line py-5"><Skeleton className="h-4 w-40" /></div>
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ------------------------------------------------------------ /gunun-ozeti */

export function DailySummaryPageLoading() {
  return (
    <ShellSkeleton active="/gunun-ozeti">
      <div role="status" aria-label="Günler yükleniyor">
        <PageHeaderSkeleton actionWidth="w-44" />
        <div className="card !p-0">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex min-h-16 items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
              <div className="min-w-0 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-56 max-w-full" /></div>
              <Skeleton className="size-5 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}

/* ------------------------------------------------------------------ /bulten */

export function NewsletterPageLoading() {
  return (
    <ShellSkeleton active="/bulten">
      <div role="status" aria-label="Aboneler yükleniyor">
        <PageHeaderSkeleton />
        <div className="card mb-5 !p-0">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2"><Skeleton className="size-11 rounded-full" /><Skeleton className="h-11 w-full min-w-40 rounded-[16px] lg:w-80" /><Skeleton className="size-11 rounded-full" /></div>
            <div className="flex shrink-0 gap-2"><Skeleton className="h-11 w-28 rounded-full" /><Skeleton className="h-11 w-28 rounded-full" /></div>
          </div>
          <div className="border-b border-line px-4 py-3 sm:px-5"><Skeleton className="h-4 w-64 max-w-full" /><Skeleton className="mt-2 h-3 w-40" /></div>
          <div className="border-b border-line px-4 py-3 sm:px-5"><Skeleton className="h-10 w-52 rounded-full" /></div>
          <div className="px-4 py-5 sm:px-6">
            {[0, 1, 2].map((index) => (
              <div key={index} className={index ? "mt-4" : ""}><Skeleton className="h-3.5 w-full max-w-[60ch]" /><Skeleton className="mt-2 h-3.5 w-full max-w-[52ch]" /></div>
            ))}
          </div>
        </div>
        <div className="card mb-5 !p-0"><div className="grid grid-cols-3 divide-x divide-line">{[0, 1, 2].map((index) => (
          <div key={index} className="px-4 py-4 sm:px-5"><Skeleton className="h-3 w-14" /><Skeleton className="mt-3 h-7 w-12" /></div>
        ))}</div></div>
        <div className="card !p-0">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center">
            <Skeleton className="h-10 w-60 rounded-full" />
            <div className="flex gap-2 lg:flex-1"><Skeleton className="h-11 flex-1 rounded-full" /><Skeleton className="h-11 w-28 shrink-0 rounded-full" /></div>
          </div>
          <div className="px-4 sm:px-5">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex min-h-16 items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
                <div className="min-w-0 flex-1"><Skeleton className="h-4 w-56 max-w-full" /><Skeleton className="mt-2 h-3 w-40" /></div>
                <Skeleton className="size-11 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between xl:mb-4">
          <Skeleton className="h-5 w-80 max-w-full" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-9 w-16 rounded-full" />)}
          </div>
        </div>
        <StatCardsSkeleton count={4} className="grid grid-cols-2 gap-3 xl:grid-cols-4 [&>div]:min-h-[140px]" />
        <div className="mt-5 grid gap-5 xl:grid-cols-12">
          <div className="card xl:col-span-8 xl:min-h-0 xl:overflow-hidden xl:p-5">
            <Skeleton className="h-7 w-48" />
            <div className="mt-8 flex h-[240px] items-end gap-1.5">
              {[55, 72, 40, 88, 61, 35, 79, 50, 66, 44, 82, 58].map((height, index) => (
                <Skeleton key={index} className="flex-1 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="card xl:col-span-4 xl:min-h-0 xl:overflow-hidden xl:p-5">
            <Skeleton className="h-7 w-40" />
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((index) => (
                <div key={index}><Skeleton className="mb-2 h-4 w-full" /><Skeleton className="h-2 w-full rounded-full" /></div>
              ))}
            </div>
          </div>
          <div className="card xl:col-span-8 xl:min-h-0 xl:overflow-hidden xl:p-5"><Skeleton className="h-7 w-56" /><TableRowsSkeleton rows={3} /></div>
          <div className="card xl:col-span-4 xl:min-h-0 xl:overflow-hidden xl:p-5">
            <Skeleton className="h-7 w-40" />
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((index) => <Skeleton key={index} className="h-5 w-full" />)}
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

/* -------------------------------------------------------------- editors */

/** Post editors use the 1fr + 360px form grid. */
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
            <div><Skeleton className="mb-2 h-4 w-28" /><Skeleton className="h-[360px] w-full rounded-field" /></div>
            <Field />
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

/* ----------------------------------------------------------------- (auth) */

/** `AuthShell` is a single centred card, so its fallback is one too. */
export function AuthPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10" role="status" aria-label="Sayfa yükleniyor">
      <section className="w-full max-w-[460px] rounded-card border border-line bg-surface p-6 sm:p-9">
        <div className="mb-10 flex items-center gap-3"><Skeleton className="size-8 rounded-[11px]" /><Skeleton className="h-5 w-24" /></div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mb-8 mt-3 h-4 w-full" />
        <div className="space-y-4"><Skeleton className="h-12 w-full rounded-field" /><Skeleton className="h-12 w-full rounded-field" /><Skeleton className="h-12 w-full rounded-full" /></div>
      </section>
    </main>
  );
}
