"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FontPicker, FontSizePicker } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { InstallPrompt, PushToggle } from "@/components/features/visitor/push";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The site navigation. The sections come from the shared list so the sheet and the footer links
 * cannot drift apart.
 */
export function VisitorMenu({ language, siteName, pushPublicKey }: { language: VisitorLanguage; siteName: string; pushPublicKey: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isEnglish = language === "en";
  const settings = [
    { label: isEnglish ? "Language" : "Dil", control: <LanguagePicker language={language} path={pathname} onNavigate={() => setOpen(false)} /> },
    { label: isEnglish ? "Theme" : "Tema", control: <ThemePicker language={language} /> },
    { label: isEnglish ? "Font" : "Yazı tipi", control: <FontPicker language={language} /> },
    { label: isEnglish ? "Font size" : "Yazı boyutu", control: <FontSizePicker language={language} /> },
    ...(pushPublicKey ? [{ label: isEnglish ? "Notifications" : "Bildirimler", control: <PushToggle language={language} publicKey={pushPublicKey} /> }] : []),
    { label: isEnglish ? "App" : "Uygulama", control: <InstallPrompt language={language} /> },
  ];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={isEnglish ? "Open menu" : "Menüyü aç"} aria-expanded={open} className="grid size-9 place-items-center rounded-[12px] bg-ink text-ink-contrast shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-all hover:-translate-y-px hover:opacity-80 hover:shadow-soft">
        <Menu size={18} aria-hidden="true" />
      </button>

      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={siteName} closeLabel={isEnglish ? "Close menu" : "Menüyü kapat"}>
        <div className="space-y-5">
          <nav className="grid grid-cols-2 gap-2" aria-label={isEnglish ? "Main navigation" : "Ana navigasyon"}>
            {visitorNavItems.filter((item) => item.href !== "/").map((item) => {
              const current = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={languageHref(item.href, language)}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={`visitor-heading group relative flex min-h-20 items-end rounded-field border p-5 text-[length:var(--vt-h3)] font-semibold tracking-[-.04em] transition-all hover:-translate-y-px hover:shadow-soft sm:min-h-24 ${
                    current ? "border-transparent bg-ink text-ink-contrast" : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <span className={`absolute right-4 top-4 size-2 rounded-full transition-colors ${current ? "bg-ink-contrast" : "bg-line-strong group-hover:bg-ink"}`} aria-hidden="true" />
                  <span>{item[language]}</span>
                </Link>
              );
            })}
          </nav>

          <section className="border-t border-line pt-5" aria-labelledby="visitor-menu-settings-title">
            <h3 id="visitor-menu-settings-title" className="visitor-muted mb-2.5 px-1 text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.16em] text-faint">
              {isEnglish ? "Settings" : "Ayarlar"}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {settings.map((row) => (
                <div key={row.label} className="flex flex-col items-stretch gap-2.5 rounded-field border border-line bg-surface p-3.5 sm:items-start">
                  <p className="visitor-muted min-w-0 text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.14em] text-faint">{row.label}</p>
                  {row.control}
                </div>
              ))}
            </div>
          </section>
        </div>
      </VisitorBottomSheet>
    </>
  );
}
