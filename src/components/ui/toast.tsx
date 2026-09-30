"use client";

import { X } from "lucide-react";
import { Toaster, toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info";

function ToastCard({ id, message, variant }: { id: string | number; message: string; variant: ToastVariant }) {
  const isEnglish = typeof document !== "undefined" && document.documentElement.lang === "en";
  // One ink line: a small dot says what kind it is, the words say the rest.
  return (
    <div role={variant === "error" ? "alert" : "status"} data-variant={variant} className="feed-toast">
      <span className="feed-toast-dot" aria-hidden="true" />
      <p>{message}</p>
      <button type="button" onClick={() => sonnerToast.dismiss(id)} aria-label={isEnglish ? "Dismiss notification" : "Bildirimi kapat"}>
        <X className="size-4" strokeWidth={2} aria-hidden="true" />
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
