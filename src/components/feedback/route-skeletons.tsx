import { Skeleton } from "@/components/feedback/states";
import { PageHeaderSkeleton, StatCardsSkeleton, TableRowsSkeleton } from "@/components/feedback/skeletons";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";

/**
 * One skeleton per admin route, each shaped like the page it stands in for.
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

/* ------------------------------------------- /yazilar/[id]/gorsel-uret */

export function ImageGeneratorLoading() {
  return (
    <ShellSkeleton active="/yazilar">
      <div className="mx-auto w-full max-w-[1180px]" role="status" aria-label="Görsel üreteci yükleniyor">
        <PageHeaderSkeleton actionWidth="w-40" />
        <div className="grid gap-5 lg:grid-cols-[minmax(300px,.72fr)_minmax(0,1.28fr)]">
          <div className="card h-fit space-y-5">
            <div><Skeleton className="h-6 w-36" /><Skeleton className="mt-2 h-4 w-full" /></div>
            <Field height="h-44" />
            <Field />
            <Field />
            <Field />
            <div><Skeleton className="mb-2 h-4 w-16" /><div className="grid grid-cols-3 gap-2"><Skeleton className="h-11 rounded-full" /><Skeleton className="h-11 rounded-full" /><Skeleton className="h-11 rounded-full" /></div></div>
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          <div className="card">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div><Skeleton className="h-6 w-28" /><Skeleton className="mt-2 h-4 w-56" /></div>
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
            <Skeleton className="mx-auto aspect-[4/5] max-h-[75vh] w-full rounded-panel" />
          </div>
        </div>
      </div>
    </ShellSkeleton>
  );
}
