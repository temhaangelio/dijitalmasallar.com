"use client";

import { Check, CircleAlert, Info, X } from "lucide-react";
import { Toaster, toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info";

function ToastCard({ id, message, variant }: { id: string | number; message: string; variant: ToastVariant }) {
  const Icon = variant === "success" ? Check : variant === "error" ? CircleAlert : Info;
  const isEnglish = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lang") === "en";
  return (
    <div role={variant === "error" ? "alert" : "status"} className="flex w-[min(380px,calc(100vw-32px))] items-center gap-3 rounded-[16px] border border-white/10 bg-[#242424] py-2 pl-4 pr-2 text-white shadow-[0_8px_30px_rgba(0,0,0,.14)]">
      <Icon className="size-[18px] shrink-0 text-white/80" strokeWidth={1.8} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[14px] leading-[1.5] [overflow-wrap:anywhere]">{message}</p>
      <button type="button" onClick={() => sonnerToast.dismiss(id)} aria-label={isEnglish ? "Dismiss notification" : "Bildirimi kapat"} className="grid size-11 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function showToast(message: string, variant: ToastVariant = "info") {
  return sonnerToast.custom((id) => <ToastCard id={id} message={message} variant={variant} />, { duration: variant === "error" ? 6000 : 3500 });
}

export function AppToaster() {
  return <Toaster position="bottom-center" gap={8} offset="max(20px, env(safe-area-inset-bottom))" mobileOffset={{ bottom: "max(16px, env(safe-area-inset-bottom))", left: 16, right: 16 }} visibleToasts={2} />;
}
