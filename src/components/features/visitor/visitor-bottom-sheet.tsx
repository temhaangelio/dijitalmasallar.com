"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Everything that can hold focus inside the panel, in document order. */
const focusableSelector = 'summary, a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function VisitorBottomSheet({ open, title, titleClassName, closeLabel, onOpenChange, children }: { open: boolean; title: string; titleClassName?: string; closeLabel: string; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  const titleId = useId();
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;

    /*
     * Locking the body also has to replace the scrollbar it removes. Without that, desktop pages
     * jump sideways by its width the moment the sheet opens and jump back when it closes — the
     * whole feed shifting under a dialog that is only meant to sit on top of it.
     */
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    /*
     * `aria-modal` claims focus is confined to the dialog; nothing was confining it. Tab walked
     * straight out into the feed behind, which for a keyboard or screen-reader user means the sheet
     * silently stops being a dialog. The cycle is closed here, and focus goes back to whatever
     * opened the sheet when it closes.
     */
    const opener = document.activeElement as HTMLElement | null;
    /*
     * Focused here rather than with `autoFocus`, which the browser only honours on the elements
     * that natively take focus — on a heading it did nothing, and focus sat on `<body>`, from where
     * the very first Tab stepped out into the page behind.
     */
    heading.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(focusableSelector)].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      const outside = !panel.current.contains(active);
      if (event.shiftKey && (outside || active === heading.current || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
      opener?.focus?.();
    };
  }, [onOpenChange, open]);

  if (!open) return null;
  const portalRoot = document.querySelector<HTMLElement>(".visitor-page") ?? document.body;

  return createPortal(
    <div className="visitor-sheet-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-black/25 px-0 backdrop-blur-[2px] sm:items-center sm:px-6" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <section ref={panel} className="visitor-sheet-panel w-full max-w-[480px] max-h-[calc(100dvh-1rem)] flex flex-col overflow-hidden rounded-t-[24px] border border-line-strong bg-surface text-ink shadow-modal sm:rounded-[24px]" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true"><span className="h-[3px] w-9 rounded-full bg-line-strong" /></div>
        <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-3 sm:px-7 sm:pb-5 sm:pt-6">
          {/* The heading takes focus rather than the close button: opening a sheet should announce
              what it is, not offer the way out first. */}
          <h2 ref={heading} id={titleId} tabIndex={-1} className={cn("focus:outline-none", titleClassName ?? "visitor-heading text-[24px] font-semibold leading-[1.15] tracking-[-.035em]")}>{title}</h2>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={closeLabel} className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:border-ink hover:bg-surface-2">
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-7">
          {children}
        </div>
      </section>
    </div>,
    portalRoot,
  );
}
