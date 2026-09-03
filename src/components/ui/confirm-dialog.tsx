"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/brand-mark";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  error?: string | null;
  variant?: "primary" | "destructive";
  onConfirm: () => boolean | void | Promise<boolean | void>;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  error,
  variant = "primary",
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onOpenChange(false);
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])");
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
  }, [open, onOpenChange, pending]);

  if (!open) return null;

  async function confirm() {
    setPending(true);
    try {
      const shouldClose = await onConfirm();
      if (shouldClose !== false) onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/35 px-4 py-8 backdrop-blur-[2px]" onMouseDown={() => !pending && onOpenChange(false)}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-[440px] rounded-card bg-white p-6 shadow-modal sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5">
          <BrandMark className="!size-11 shrink-0" />
          <button type="button" disabled={pending} aria-label="Onay penceresini kapat" onClick={() => onOpenChange(false)} className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        <h2 id={titleId} className="mt-5 text-[26px] font-bold leading-tight tracking-[-.04em]">{title}</h2>
        <p id={descriptionId} className="mt-2 text-[15px] font-medium leading-relaxed text-muted">{description}</p>
        {error && <p role="alert" className="mt-4 rounded-field bg-danger-surface p-3 text-sm font-medium text-danger">{error}</p>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button type="button" disabled={pending} onClick={confirm} variant={variant === "destructive" ? "danger" : "primary"}>{pending ? "İşleniyor…" : confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
