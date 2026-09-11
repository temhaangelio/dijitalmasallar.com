"use client";

import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

// Keep preference controls off the critical path; the dialog shell opens immediately.
const VisitorSettingsContent = dynamic(() => import("./visitor-settings-content"), {
  loading: () => <div role="status" className="visitor-settings">
    <span className="sr-only">Ayarlar yükleniyor / Loading settings</span>
    {[0, 1, 2].map(row => <div key={row} className="visitor-settings-row" aria-hidden="true"><span className="h-4 w-14 rounded bg-surface-3" /><div className="h-[52px] rounded-xl bg-surface-2" /></div>)}
    <div className="visitor-settings-row visitor-settings-colors" aria-hidden="true"><div className="h-4 w-10 rounded bg-surface-3" /><div className="visitor-accent-picker">{[0, 1, 2, 3].map(index => <div key={index} className="visitor-accent-option"><span className="size-7 rounded-full bg-surface-3" /></div>)}</div></div>
    <div className="visitor-settings-footer" aria-hidden="true"><span className="h-4 w-24 rounded bg-surface-3" /><span className="h-11 w-24 rounded-xl bg-surface-2" /></div>
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

      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={isEnglish ? "Settings" : "Ayarlar"} panelClassName="visitor-settings-sheet max-h-[85dvh]" titleClassName="visitor-sans text-[22px] font-bold leading-tight tracking-[-.03em]" closeLabel={isEnglish ? "Close settings" : "Ayarları kapat"}>
        {open ? <VisitorSettingsContent language={language} pushPublicKey={pushPublicKey} onClose={() => setOpen(false)} /> : null}
      </VisitorBottomSheet>
    </>
  );
}
