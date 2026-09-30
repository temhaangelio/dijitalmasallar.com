import type { ReactNode } from "react";
import { Skeleton } from "@/components/feedback/states";

/** The masthead every viewport shares, matching VisitorShell. */
export function VisitorShellSkeleton({ children, label, showHeader = true, reading = false }: { children: ReactNode; label: string; showHeader?: boolean; reading?: boolean }) {
  return (
    <div className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-4 pb-10 text-ink sm:px-8" role="status" aria-label={label}>
      {showHeader ? <>
        {/* The one-row masthead, matching VisitorShell. */}
        <div data-reading={reading || undefined} className="visitor-masthead feed-masthead relative z-[1] flex w-full flex-col pb-2 pt-4 sm:pb-3 sm:pt-6">
          <div className="relative flex w-full items-center justify-between gap-2">
            <div className="flex min-h-11 items-center gap-3"><Skeleton className="size-9 rounded-[12px] sm:size-10 sm:rounded-[13px]" /><Skeleton className="visitor-wordmark-beside h-5" /></div>
            {reading ? null : <div className="feed-masthead-nav"><div className="visitor-header-links"><div className="visitor-nav-track">{["w-14", "w-14", "w-16"].map((width, index) => <div key={index} className="visitor-header-link"><Skeleton className={`h-3.5 ${width}`} /></div>)}</div></div></div>}
            <div className="flex shrink-0 items-center gap-1">
              {[0, 1, 2].map((index) => <Skeleton key={index} className="size-10 rounded-[12px]" />)}
            </div>
          </div>
        </div>
      </> : null}

      <div className="visitor-content flex w-full flex-col items-center">
        {children}
        <footer className="visitor-footer mt-14 flex w-full items-center justify-center gap-4 border-t border-line px-1 pt-6">
          <Skeleton className="h-4 w-28" />
          <span className="h-3 w-px bg-line-strong" />
          <Skeleton className="h-4 w-14" />
        </footer>
      </div>
    </div>
  );
}
