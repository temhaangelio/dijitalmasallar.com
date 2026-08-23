"use client";

import { X } from "lucide-react";
import { Toaster, toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info";

function ToastCard({ id, message, variant }: { id: string | number; message: string; variant: ToastVariant }) {
  return <div role={variant === "error" ? "alert" : "status"} className="flex w-[min(390px,calc(100vw-32px))] items-start gap-3 rounded-[20px] border border-black/10 bg-white p-3.5 text-[#0a0a0a] shadow-[0_18px_50px_rgba(0,0,0,.16)]">
    <span className="brand-mark !size-10 shrink-0 !rounded-[12px]" aria-hidden="true" />
    <div className="min-w-0 flex-1 pt-0.5"><strong className="block text-[13px]">{variant === "success" ? "İşlem tamamlandı" : variant === "error" ? "İşlem tamamlanamadı" : "Bilgilendirme"}</strong><p className="mt-1 text-[13px] leading-5 text-[#666]">{message}</p></div>
    <button type="button" onClick={() => sonnerToast.dismiss(id)} aria-label="Bildirimi kapat" className="grid size-8 shrink-0 place-items-center rounded-full text-[#999] hover:bg-[#f1f1f1] hover:text-black"><X size={15} /></button>
  </div>;
}

export function showToast(message: string, variant: ToastVariant = "info") {
  return sonnerToast.custom((id) => <ToastCard id={id} message={message} variant={variant} />, { duration: variant === "error" ? 6000 : 4000 });
}

export function AppToaster() {
  return <Toaster position="top-right" gap={10} offset={18} visibleToasts={4} />;
}
