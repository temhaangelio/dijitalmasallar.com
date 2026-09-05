"use client";

import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalFocus } from "@/components/hooks/use-modal-focus";
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
  const [failure, setFailure] = useState<string | null>(null);
  function closeDialog() { setFailure(null); onOpenChange(false); }
  useModalFocus({ open, busy: pending, panelRef, initialFocusRef: cancelRef, onClose: closeDialog });

  if (!open) return null;

  async function confirm() {
    setPending(true);
    setFailure(null);
    try {
      const shouldClose = await onConfirm();
      if (shouldClose !== false) closeDialog();
    } catch {
      setFailure("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/35 px-4 py-8 backdrop-blur-[2px]" onMouseDown={() => !pending && closeDialog()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-[440px] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-[18px] border border-line bg-surface p-6 shadow-pop sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5">
          <BrandMark className="!size-11 shrink-0" />
          <button type="button" disabled={pending} aria-label="Onay penceresini kapat" onClick={closeDialog} className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        <h2 id={titleId} className="mt-5 font-[family-name:var(--font-source-serif)] text-[26px] font-medium leading-tight tracking-[-.04em]">{title}</h2>
        <p id={descriptionId} className="mt-2 text-[15px] font-medium leading-relaxed text-muted">{description}</p>
        {(error || failure) && <p role="alert" className="mt-4 rounded-field bg-danger-surface p-3 text-sm font-medium text-danger">{error || failure}</p>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="secondary" disabled={pending} onClick={closeDialog}>{cancelLabel}</Button>
          <Button type="button" disabled={pending} onClick={confirm} variant={variant === "destructive" ? "danger" : "primary"}>{pending ? "İşleniyor…" : confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.querySelector<HTMLElement>(".admin-page") ?? document.body,
  );
}
