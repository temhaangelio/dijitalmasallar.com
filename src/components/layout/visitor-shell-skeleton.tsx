import type { ReactNode } from "react";
import { Skeleton } from "@/components/feedback/states";

/** The top bar every viewport shares, matching VisitorShell. */
export function VisitorShellSkeleton({ children, label, showHeader = true, reading = false }: { children: ReactNode; label: string; showHeader?: boolean; compact?: boolean; reading?: boolean }) {
  return (
    <div className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-4 pb-10 text-ink sm:px-8" role="status" aria-label={label}>
      {showHeader ? <>
        {/* The same bar as VisitorShell: brand, sections, controls. */}
        <div data-reading={reading || undefined} className="visitor-topbar">
          <div className="visitor-topbar-inner">
            <div className="visitor-topbar-brand"><Skeleton className="size-8 rounded-[10px]" /><Skeleton className="h-4 w-28" /></div>
            {reading ? <span className="visitor-topbar-nav" /> : <div className="visitor-topbar-nav"><div className="visitor-header-links"><div className="visitor-nav-track">
              {["w-10", "w-16", "w-16"].map((width, index) => <div key={index} className="visitor-header-link"><Skeleton className={`h-4 ${width}`} /></div>)}
            </div></div></div>}
            <div className="visitor-topbar-actions">{[0, 1, 2].map((index) => <Skeleton key={index} className="size-9 rounded-[10px]" />)}</div>
          </div>
        </div>
        {reading ? null : <div className="visitor-subnav"><div className="visitor-header-links"><div className="visitor-nav-track">
          {["w-10", "w-16", "w-16"].map((width, index) => <div key={index} className="visitor-header-link"><Skeleton className={`h-4 ${width}`} /></div>)}
        </div></div></div>}
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
