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
        <div className="grid gap-3">
          {[
            { label: isEnglish ? "Language" : "Dil", control: <LanguagePicker language={language} path={pathname} onNavigate={() => setOpen(false)} /> },
            { label: isEnglish ? "Theme" : "Tema", control: <ThemePicker language={language} /> },
            { label: isEnglish ? "Font" : "Yazı tipi", control: <FontPicker language={language} /> },
            { label: isEnglish ? "Font size" : "Yazı boyutu", control: <FontSizePicker language={language} /> },
          ].map((row) => (
            <div key={row.label} className="flex flex-col items-stretch gap-3 rounded-field border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="visitor-muted min-w-0 text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.14em] text-faint">{row.label}</p>
              {row.control}
            </div>
          ))}
        </div>
      </VisitorBottomSheet>
    </>
  );
}
