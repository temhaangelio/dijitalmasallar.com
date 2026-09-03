"use client";

import { X } from "lucide-react";
import { Toaster, toast as sonnerToast } from "sonner";
import { BrandMark } from "@/components/ui/brand-mark";

type ToastVariant = "success" | "error" | "info";

const titles: Record<ToastVariant, string> = {
  success: "İşlem tamamlandı",
  error: "İşlem tamamlanamadı",
  info: "Bilgilendirme",
};

/** Deliberately dark in both themes: the toast reads as an overlay, not as part of the page. */
function ToastCard({ id, message, variant }: { id: string | number; message: string; variant: ToastVariant }) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className="on-dark flex w-[min(390px,calc(100vw-32px))] items-start gap-3 rounded-panel border border-white/10 bg-ink p-3.5 text-white shadow-modal"
    >
      <BrandMark className="!size-10 shrink-0 !rounded-chip" />
      <div className="min-w-0 flex-1 pt-0.5">
        <strong className="block text-[13px] text-white">{titles[variant]}</strong>
        <p className="mt-1 text-[13px] leading-5 text-on-dark">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => sonnerToast.dismiss(id)}
        aria-label="Bildirimi kapat"
        className="grid size-8 shrink-0 place-items-center rounded-full text-on-dark transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={15} aria-hidden="true" />
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
