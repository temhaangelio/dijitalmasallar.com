"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useModalFocus } from "@/components/hooks/use-modal-focus";
import { BrandMark } from "@/components/ui/brand-mark";

/**
 * On a phone the dialog is a sheet: it rises from the bottom edge, where the thumb is, and takes
 * the full width — the same way the public site opens its daily brief. From `sm` it is the
 * centred panel a desktop expects.
 */
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

  useModalFocus({ open: true, busy, panelRef, initialFocusRef, onClose });

  return createPortal(
    <div className="visitor-sheet-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-8" onMouseDown={() => !busy && onClose()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={hideIdentity ? title : undefined}
        aria-labelledby={hideIdentity ? undefined : titleId}
        className={`visitor-sheet-panel w-full max-w-[520px] max-h-[92dvh] overflow-y-auto rounded-t-[22px] border border-line bg-surface p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-pop sm:max-h-[calc(100dvh-32px)] sm:rounded-[18px] sm:p-7 ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`flex items-start gap-5 ${hideIdentity ? "justify-end" : "justify-between"}`}>
          {!hideIdentity ? <BrandMark className="!size-11 shrink-0" /> : null}
          <button type="button" disabled={busy} aria-label="Pencereyi kapat" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        {!hideIdentity ? <h2 id={titleId} className="mt-5 font-[family-name:var(--font-visitor-sans)] text-[26px] font-medium leading-tight tracking-[-.04em]">{title}</h2> : null}
        {children}
      </div>
    </div>,
    document.querySelector<HTMLElement>(".admin-page") ?? document.body,
  );
}
