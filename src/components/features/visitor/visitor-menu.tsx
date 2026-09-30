"use client";

import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

// Keep preference controls off the critical path; the dialog shell opens immediately.
const VisitorSettingsContent = dynamic(() => import("./visitor-settings-content"), {
  loading: () => <div role="status" className="visitor-settings">
    <span className="sr-only">Ayarlar yükleniyor / Loading settings</span>
    {[0, 1, 2].map(row => <div key={row} className="visitor-settings-row" aria-hidden="true"><span className="h-4 w-14 rounded bg-surface-3" /><div className="h-[52px] rounded-xl bg-surface-2" /></div>)}
    <div className="visitor-settings-footer" aria-hidden="true"><span className="h-4 w-24 rounded bg-surface-3" /><span className="h-11 w-24 rounded-xl bg-surface-2" /></div>
  </div>,
});

/*
 * From `sm` up the sections sit in the masthead and the sheet holds settings only, so it is called
 * "Settings"; on a phone it also carries the sections, and is the "Menu".
 */
const wideQuery = "(min-width: 640px)";
function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(wideQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const wideSnapshot = () => window.matchMedia(wideQuery).matches;
const wideServerSnapshot = () => false;

/** A focused preferences sheet; page navigation stays in the editorial header. */
export function VisitorMenu({ language, pushPublicKey }: { language: VisitorLanguage; pushPublicKey: string }) {
  const [open, setOpen] = useState(false);
  const isEnglish = language === "en";
  const wide = useSyncExternalStore(subscribeWide, wideSnapshot, wideServerSnapshot);
  const name = wide ? (isEnglish ? "Settings" : "Ayarlar") : (isEnglish ? "Menu" : "Menü");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={wide ? (isEnglish ? "Open settings" : "Ayarları aç") : (isEnglish ? "Open menu" : "Menüyü aç")} aria-expanded={open} aria-haspopup="dialog" title={name} className="visitor-top-control">
        <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
      </button>

      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={name} panelClassName="visitor-settings-sheet max-h-[85dvh]" titleClassName="visitor-sans text-[22px] font-bold leading-tight tracking-[-.03em]" closeLabel={wide ? (isEnglish ? "Close settings" : "Ayarları kapat") : (isEnglish ? "Close menu" : "Menüyü kapat")}>
        {open ? <VisitorSettingsContent language={language} pushPublicKey={pushPublicKey} onClose={() => setOpen(false)} /> : null}
      </VisitorBottomSheet>
    </>
  );
}
