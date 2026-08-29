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
    <div className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-6 pb-10 text-ink sm:px-8" role="status" aria-label={label}>
      {showHeader ? <div className="flex w-full max-w-[900px] flex-col items-center pb-4 pt-12 sm:pb-6 sm:pt-16">
        <div className="flex w-full max-w-[640px] items-center justify-between">
          <Skeleton className="size-9 rounded-[12px]" />
          <div className="flex items-center gap-2">
            {[0, 1].map((index) => <Skeleton key={index} className="size-9 rounded-[12px]" />)}
          </div>
        </div>
        <Skeleton className="mt-8 h-7 w-32 sm:mt-10" />
        <div className="mt-4 flex flex-col items-center gap-4">
          <Skeleton className="h-5 w-96 max-w-full" />
          <Skeleton className="h-5 w-80 max-w-full" />
          <div className="mt-2 flex items-center gap-[22px]">
            {["w-10", "w-14", "w-16"].map((width) => <Skeleton key={width} className={`h-3 ${width}`} />)}
          </div>
        </div>
      </div> : null}
      {children}
      <footer className="mt-14 flex w-full max-w-[640px] justify-center border-t border-line px-1 pt-6">
        <Skeleton className="h-4 w-28" />
      </footer>
    </div>
  );
}
