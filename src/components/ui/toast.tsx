"use client";

import { X } from "lucide-react";
import { Toaster, toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info";

const titles: Record<ToastVariant, string> = {
  success: "İşlem tamamlandı",
  error: "İşlem tamamlanamadı",
  info: "Bilgilendirme",
};

/** A compact editorial notice that uses the same paper, rule, type and accent as the visitor pages. */
function ToastCard({ id, message, variant }: { id: string | number; message: string; variant: ToastVariant }) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className="flex w-[min(380px,calc(100vw-32px))] items-start overflow-hidden rounded-field border border-line-strong bg-surface text-ink shadow-pop [font-family:var(--font-plex-sans)]"
    >
      <span className="w-1 self-stretch bg-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <strong className="block font-mono text-[10px] font-medium uppercase leading-none tracking-[.16em] text-ink">{titles[variant]}</strong>
        <p className="mt-2 text-[14px] font-normal leading-[1.5] text-muted">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => sonnerToast.dismiss(id)}
        aria-label="Bildirimi kapat"
        className="mr-2 mt-2 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <X size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

export function showToast(message: string, variant: ToastVariant = "info") {
  return sonnerToast.custom((id) => <ToastCard id={id} message={message} variant={variant} />, { duration: variant === "error" ? 6000 : 4000 });
}

export function AppToaster() {
  return <Toaster position="top-right" gap={10} offset={18} visibleToasts={4} />;
}
