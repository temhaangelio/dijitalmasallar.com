import { Skeleton } from "@/components/feedback/states";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";

/**
 * Every route under `(dashboard)` now ships its own `loading.tsx`, so this is only a safety net for
 * a route added later. It stays deliberately generic — and, like the other skeletons, shows no
 * branded mark, only placeholders.
 */
export default function Loading() {
  return (
    <ShellSkeleton active="">
      <div role="status" aria-label="Panel yükleniyor">
        <PageHeaderSkeleton />
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="card"><Skeleton className="h-7 w-40" /><Skeleton className="mt-5 h-4 w-full" /><Skeleton className="mt-2 h-4 w-2/3" /></div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
