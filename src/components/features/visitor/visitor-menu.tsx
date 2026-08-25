"use client";

import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { InstallPrompt, PushToggle } from "@/components/features/visitor/push";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** A focused preferences sheet; page navigation stays in the editorial header. */
export function VisitorMenu({ language, pushPublicKey }: { language: VisitorLanguage; pushPublicKey: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isEnglish = language === "en";
  const settings = [
    {
      label: isEnglish ? "Language" : "Dil",
      control: <LanguagePicker language={language} path={pathname} onNavigate={() => setOpen(false)} />,
    },
    {
      label: isEnglish ? "Theme" : "Tema",
      control: <ThemePicker language={language} />,
    },
    ...(pushPublicKey ? [{
      label: isEnglish ? "Notifications" : "Bildirimler",
      control: <PushToggle language={language} publicKey={pushPublicKey} />,
    }] : []),
    {
      label: isEnglish ? "App" : "Uygulama",
      control: <InstallPrompt language={language} />,
    },
  ];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={isEnglish ? "Open settings" : "Ayarları aç"} aria-expanded={open} className="grid size-9 place-items-center rounded-[12px] bg-ink text-ink-contrast shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-all hover:-translate-y-px hover:opacity-80 hover:shadow-soft">
        <Settings size={18} aria-hidden="true" />
      </button>

      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={isEnglish ? "Settings" : "Ayarlar"} closeLabel={isEnglish ? "Close settings" : "Ayarları kapat"}>
        <section className="divide-y divide-line border-t border-line text-left" aria-label={isEnglish ? "Settings" : "Ayarlar"}>
          {settings.map((row) => (
            <div key={row.label} className="grid gap-3 py-4 sm:grid-cols-[100px_minmax(0,1fr)] sm:items-center sm:gap-5">
              <h3 className="font-mono text-[10px] font-medium uppercase leading-none tracking-[.16em] text-muted sm:text-[11px]">{row.label}</h3>
              <div className="min-w-0 sm:justify-self-end">{row.control}</div>
            </div>
          ))}
        </section>
      </VisitorBottomSheet>
    </>
  );
}
