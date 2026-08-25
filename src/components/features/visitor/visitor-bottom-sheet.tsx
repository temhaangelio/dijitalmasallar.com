"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

export function VisitorBottomSheet({ open, title, closeLabel, onOpenChange, children }: { open: boolean; title: string; closeLabel: string; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="visitor-sheet-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-ink/20 px-0 backdrop-blur-[2px] sm:items-center sm:px-6" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <section className="visitor-sheet-panel w-full max-w-[560px] overflow-hidden rounded-t-[24px] border border-line-strong bg-surface text-ink shadow-modal sm:rounded-[24px]" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true"><span className="h-[3px] w-9 rounded-full bg-line-strong" /></div>
        <header className="flex items-center justify-between px-5 pb-4 pt-3 sm:px-7 sm:pb-5 sm:pt-6">
          <h2 id={titleId} className="visitor-heading text-[24px] font-semibold leading-none tracking-[-.035em]">{title}</h2>
          <button autoFocus type="button" onClick={() => onOpenChange(false)} aria-label={closeLabel} className="grid size-9 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink hover:bg-surface-2">
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>
        <div className="max-h-[min(78dvh,660px)] overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-7">
          {children}
        </div>
      </section>
    </div>
  );
}
