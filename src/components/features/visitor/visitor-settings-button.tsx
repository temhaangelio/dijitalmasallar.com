"use client";

import { Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FontPicker, FontSizePicker } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

export function VisitorSettingsButton({ language }: { language: VisitorLanguage }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isEnglish = language === "en";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={isEnglish ? "Page settings" : "Sayfa ayarları"} aria-expanded={open} className="grid size-9 place-items-center rounded-[12px] bg-ink text-ink-contrast shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-all hover:-translate-y-px hover:opacity-80 hover:shadow-soft">
        <Settings2 size={17} aria-hidden="true" />
      </button>
      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={isEnglish ? "Page settings" : "Sayfa ayarları"} closeLabel={isEnglish ? "Close settings" : "Ayarları kapat"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative rounded-field bg-surface p-4"><span className="absolute right-4 top-4 size-2 rounded-full bg-ink" aria-hidden="true" /><p className="visitor-copy mb-3 text-sm font-semibold">{isEnglish ? "Language" : "Dil"}</p><LanguagePicker language={language} path={pathname} onNavigate={() => setOpen(false)} /></div>
          <div className="relative rounded-field bg-surface p-4"><span className="absolute right-4 top-4 size-2 rounded-full bg-ink" aria-hidden="true" /><p className="visitor-copy mb-3 text-sm font-semibold">{isEnglish ? "Theme" : "Tema"}</p><ThemePicker language={language} /></div>
          <div className="relative rounded-field bg-surface p-4"><span className="absolute right-4 top-4 size-2 rounded-full bg-ink" aria-hidden="true" /><p className="visitor-copy mb-3 text-sm font-semibold">{isEnglish ? "Font" : "Yazı tipi"}</p><FontPicker language={language} /></div>
          <div className="relative rounded-field bg-surface p-4"><span className="absolute right-4 top-4 size-2 rounded-full bg-ink" aria-hidden="true" /><p className="visitor-copy mb-3 text-sm font-semibold">{isEnglish ? "Font size" : "Yazı boyutu"}</p><FontSizePicker language={language} /></div>
        </div>
      </VisitorBottomSheet>
    </>
  );
}
