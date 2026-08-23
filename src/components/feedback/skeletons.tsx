import { Skeleton } from "@/components/feedback/states";

/**
 * The building blocks every admin `loading.tsx` needs. They exist so the skeletons stay in step with
 * the real layout primitives — `.page-header`, the 132px stat card, the `.card` table — instead of
 * each route re-guessing the measurements.
 */

/**
 * Matches `PageHeader` to the pixel: `.page-title` is 34px with `line-height: 1`, and `.page-note`
 * sits 6px below at a 15px font size (~20px tall). `actionWidth` is omitted entirely — rather than
 * zero-width — on pages without an action, so the header's 24px gap does not appear out of nowhere.
 */
export function PageHeaderSkeleton({ actionWidth }: { actionWidth?: string }) {
  return (
    <header className="page-header">
      <div>
        <Skeleton className="h-[34px] w-40" />
        <Skeleton className="mt-1.5 h-5 w-28" />
      </div>
      {actionWidth ? <Skeleton className={`h-11 rounded-full ${actionWidth}`} /> : null}
    </header>
  );
}

export function StatCardsSkeleton({ count, className }: { count: number; className: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex h-[132px] flex-col justify-between rounded-card bg-surface p-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5, withBody = false }: { rows?: number; withBody?: boolean }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-start gap-4 border-b border-line py-3 last:border-b-0">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-2/3" />
            {withBody ? (
              <>
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-4/5" />
              </>
            ) : null}
          </div>
          <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`card ${className ?? ""}`}>
      <Skeleton className="h-6 w-40" />
      {children}
    </div>
  );
}
