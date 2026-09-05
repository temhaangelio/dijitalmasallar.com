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
export function VisitorShellSkeleton({ children, label, showHeader = true }: { children: ReactNode; label: string; showHeader?: boolean }) {
  return (
    <div className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-4 pb-10 text-ink sm:px-8" role="status" aria-label={label}>
      {showHeader ? <div className="flex w-full max-w-[900px] flex-col items-center pb-5 pt-6 sm:pb-7 sm:pt-9">
        <div className="flex w-full max-w-[640px] items-center justify-between gap-2">
          <Skeleton className="size-9 rounded-[12px]" />
          <div className="flex items-center gap-2">
            {[0, 1].map((index) => <Skeleton key={index} className="size-9 rounded-[12px]" />)}
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 sm:mt-6 sm:gap-4">
          <Skeleton className="size-10 rounded-[13px] sm:size-11 sm:rounded-[14px]" />
          <Skeleton className="h-6 w-44 sm:h-8 sm:w-60" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5">
          <Skeleton className="h-5 w-80 max-w-full" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
        <div className="mt-6 flex items-center gap-6 sm:mt-7 sm:gap-8">
          {["w-10", "w-16", "w-20"].map((width) => <Skeleton key={width} className={`h-3 ${width}`} />)}
        </div>
      </div> : null}
      {children}
      <footer className="mt-14 flex w-full max-w-[640px] justify-center border-t border-line px-1 pt-6">
        <Skeleton className="h-4 w-28" />
      </footer>
    </div>
  );
}
