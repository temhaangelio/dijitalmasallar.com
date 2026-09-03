"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export function AppDialog({
  title,
  onClose,
  busy = false,
  initialFocusRef,
  panelClassName = "",
  hideIdentity = false,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  panelClassName?: string;
  hideIdentity?: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocusRef?.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [href]");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [busy, initialFocusRef, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/35 px-4 py-8 backdrop-blur-[2px]" onMouseDown={() => !busy && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={hideIdentity ? title : undefined}
        aria-labelledby={hideIdentity ? undefined : titleId}
        className={`w-full max-w-[520px] rounded-card bg-white p-6 shadow-modal sm:p-7 ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`flex items-start gap-5 ${hideIdentity ? "justify-end" : "justify-between"}`}>
          {!hideIdentity ? <BrandMark className="!size-11 shrink-0" /> : null}
          <button type="button" disabled={busy} aria-label="Pencereyi kapat" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        {!hideIdentity ? <h2 id={titleId} className="mt-5 text-[26px] font-bold leading-tight tracking-[-.04em]">{title}</h2> : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
