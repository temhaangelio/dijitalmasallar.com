import type { ReactNode } from "react";
import { VisitorHeaderBackdrop } from "@/components/features/visitor/visitor-header-backdrop";
import { Skeleton } from "@/components/feedback/states";

/** Shared centred header for every viewport, matching VisitorShell. */
export function VisitorShellSkeleton({ children, label, showHeader = true, compact = false, reading = false }: { children: ReactNode; label: string; showHeader?: boolean; compact?: boolean; reading?: boolean }) {
  return (
    <div className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-4 pb-10 text-ink sm:px-8" role="status" aria-label={label}>
      {showHeader ? <>
        {/* The same masthead remains visible on desktop and mobile. */}
        <div data-reading={reading || undefined} className="visitor-masthead relative z-[1] flex w-full max-w-[640px] flex-col items-center pb-2 pt-6 sm:pb-3 sm:pt-8">
          {!reading && <VisitorHeaderBackdrop />}
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-h-11 items-center gap-3"><Skeleton className="size-9 rounded-[12px] sm:size-10 sm:rounded-[13px] xl:size-[52px] xl:rounded-[16px]" /></div>
            <div className="flex shrink-0 items-center gap-2">
              {[0, 1].map((index) => <Skeleton key={index} className="size-11 rounded-[12px] xl:size-[60px] xl:rounded-[16px]" />)}
            </div>
          </div>
          <Skeleton className="visitor-wordmark-placeholder mt-6 sm:mt-7" />
          {reading ? null : <>
            {compact ? null : <div className="visitor-tagline flex flex-col items-center gap-2">
              <Skeleton className="h-5 w-64 max-w-full sm:w-[420px]" />
              <Skeleton className="h-5 w-36 sm:hidden" />
            </div>}
            <div className="visitor-header-links">
              <div className="visitor-nav-track">
                {["w-10", "w-16", "w-16"].map((width, index) => <div key={index} className="visitor-header-link"><Skeleton className={`h-4 ${width}`} /></div>)}
              </div>
            </div>
          </>}
        </div>

      </> : null}

      <div className="visitor-content flex w-full flex-col items-center">
        {children}
        <footer className="visitor-footer mt-14 flex w-full max-w-[640px] items-center justify-center gap-4 border-t border-line px-1 pt-6">
          <Skeleton className="h-4 w-28" />
          <span className="h-3 w-px bg-line-strong" />
          <Skeleton className="h-4 w-14" />
        </footer>
      </div>
    </div>
  );
}
