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
    <div className="visitor-sheet-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-black/35 px-0 backdrop-blur-[3px] sm:px-5 sm:pb-5" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <section className="visitor-sheet-panel w-full max-w-[720px] overflow-hidden rounded-t-[30px] border border-line-strong bg-canvas text-ink shadow-modal sm:rounded-[30px]" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true"><span className="h-1 w-10 rounded-full bg-line-strong" /></div>
        <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <h2 id={titleId} className="visitor-heading text-[22px] font-semibold tracking-[-.04em] sm:text-[24px]">{title}</h2>
          <button autoFocus type="button" onClick={() => onOpenChange(false)} aria-label={closeLabel} className="grid size-10 place-items-center rounded-full border border-line-strong bg-surface transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="max-h-[min(72dvh,620px)] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          {children}
        </div>
      </section>
    </div>
  );
}
