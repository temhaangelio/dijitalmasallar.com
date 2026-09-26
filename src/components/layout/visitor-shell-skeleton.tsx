import { Suspense, type ReactNode } from "react";
import { Bell, Bookmark, Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/feedback/states";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorHeaderNavFallback } from "@/components/features/visitor/visitor-header-nav-fallback";
import { BrandMark } from "@/components/ui/brand-mark";

/** Sections for the loading bar; Turkish until the address has been read. */
function NavFallback() {
  return <Suspense fallback={<VisitorHeaderNav language="tr" />}><VisitorHeaderNavFallback /></Suspense>;
}

/** The top bar every viewport shares, matching VisitorShell. */
export function VisitorShellSkeleton({ children, label, showHeader = true, reading = false, search = false }: { children: ReactNode; label: string; showHeader?: boolean; compact?: boolean; reading?: boolean; /** The feed carries a search control in the bar. */ search?: boolean }) {
  return (
    <div className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-4 pb-10 text-ink sm:px-8" role="status" aria-label={label}>
      {showHeader ? <>
        {/*
          The bar itself, not a grey sketch of it: its parts need no data, so a navigation keeps the
          same brand, sections and controls on screen and only the content below turns to skeleton.
          The controls are drawn but inert; the page brings the working ones a moment later.
        */}
        <div data-reading={reading || undefined} className="visitor-topbar">
          <div className="visitor-topbar-inner">
            <div className="visitor-topbar-brand">
              <BrandMark className="visitor-logo-mark block shrink-0 !size-8 !rounded-[10px]" />
              <span className="visitor-wordmark-art visitor-topbar-wordmark" aria-hidden="true" />
            </div>
            {reading ? <span className="visitor-topbar-nav" /> : <div className="visitor-topbar-nav"><NavFallback /></div>}
            <div className="visitor-topbar-actions" aria-hidden="true">
              {(search ? [Search, Bookmark, Bell, SlidersHorizontal] : [Bookmark, Bell, SlidersHorizontal]).map((Icon, index) => (
                <span key={index} className="visitor-top-control"><Icon size={18} strokeWidth={1.8} /></span>
              ))}
            </div>
          </div>
        </div>
        {reading ? null : <div className="visitor-subnav"><NavFallback /></div>}
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
