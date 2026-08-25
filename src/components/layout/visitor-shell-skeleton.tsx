import type { ReactNode } from "react";
import { Skeleton } from "@/components/feedback/states";

/**
 * The visitor frame with nothing in it, for the `loading.tsx` of every public route.
 *
 * It cannot use `VisitorShell` itself: the real shell needs the site name and the reader's language,
 * and both come from the request the fallback is standing in for. What it does keep is the
 * `.visitor-page` class — the dark tokens only exist inside it, so without it every skeleton would
 * flash white on a dark page — along with the column width and the nav height, so nothing shifts
 * sideways or jumps down when the page itself arrives.
 */
export function VisitorShellSkeleton({ children, label, liveBand = false }: { children: ReactNode; label: string; liveBand?: boolean }) {
  return (
    <div className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-5 pb-10 pt-5 text-ink" role="status" aria-label={label}>
      <div className="visitor-ambient" aria-hidden="true" />
      {/* The feed carries the live strip above its nav; without it here the whole page would jump
          44px upwards the moment the real one arrived. */}
      {liveBand ? <div className="-mx-5 -mt-5 h-11 w-[calc(100%+2.5rem)] border-b border-line-strong bg-ink" aria-hidden="true" /> : null}
      <div className={`flex min-h-14 w-full max-w-[720px] items-center justify-between gap-4 py-3 ${liveBand ? "mt-5" : ""}`}>
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-[11px]" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="size-9 rounded-[12px]" />)}
        </div>
      </div>
      {children}
      <footer className="mt-14 flex w-full max-w-[720px] flex-col gap-5 border-t border-line-strong px-1 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Literal classes: Tailwind only ships the utilities it can see written out in full. */}
          {["w-16", "w-14", "w-20", "w-16", "w-10"].map((width, index) => <Skeleton key={index} className={`h-5 ${width}`} />)}
        </div>
        <Skeleton className="h-4 w-28" />
      </footer>
    </div>
  );
}
