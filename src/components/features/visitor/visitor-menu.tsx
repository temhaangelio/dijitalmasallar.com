"use client";

import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

// Keep preference controls off the critical path; the dialog shell opens immediately.
const VisitorSettingsContent = dynamic(() => import("./visitor-settings-content"), {
  loading: () => <div role="status" className="min-h-64 space-y-5 py-2">
    <span className="sr-only">Ayarlar yükleniyor / Loading settings</span>
    {[0, 1, 2].map((row) => <div key={row} aria-hidden="true" className="space-y-3"><div className="h-3 w-20 rounded bg-surface-3" /><div className="h-11 rounded-xl bg-surface-2" /></div>)}
  </div>,
});

/** A focused preferences sheet; page navigation stays in the editorial header. */
export function VisitorMenu({ language, pushPublicKey }: { language: VisitorLanguage; pushPublicKey: string }) {
  const [open, setOpen] = useState(false);
  const isEnglish = language === "en";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={isEnglish ? "Open settings" : "Ayarları aç"} aria-expanded={open} aria-haspopup="dialog" title={isEnglish ? "Settings" : "Ayarlar"} className="visitor-top-control">
        <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>

      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={isEnglish ? "Settings" : "Ayarlar"} titleClassName="text-[20px] font-semibold leading-tight tracking-[-.02em]" closeLabel={isEnglish ? "Close settings" : "Ayarları kapat"}>
        {open ? <VisitorSettingsContent language={language} pushPublicKey={pushPublicKey} onClose={() => setOpen(false)} /> : null}
      </VisitorBottomSheet>
    </>
  );
}
