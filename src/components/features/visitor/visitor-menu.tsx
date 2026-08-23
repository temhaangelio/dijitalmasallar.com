"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FontPicker, FontSizePicker } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { ThemePicker } from "@/components/features/visitor/theme";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const items = [
  { href: "/", tr: "Akış", en: "Feed" },
  { href: "/newsletter", tr: "E-bülten", en: "Newsletter" },
  { href: "/about", tr: "Hakkında", en: "About" },
  { href: "/contact", tr: "İletişim", en: "Contact" },
] as const;

export function VisitorMenu({ language, siteName }: { language: VisitorLanguage; siteName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={language === "en" ? "Open menu" : "Menüyü aç"} aria-expanded={open} className="grid size-10 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft">
        <Menu size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col overflow-y-auto bg-canvas px-4 pb-6 pt-4 text-ink sm:px-6 sm:pb-8 sm:pt-5" role="dialog" aria-modal="true" aria-label={language === "en" ? "Site menu" : "Site menüsü"}>
          <div className="mx-auto flex w-full max-w-[960px] items-center justify-between border-b border-line pb-4 pt-1 sm:pb-5">
            <Link href={languageHref("/", language)} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-full">
              <span aria-hidden="true" className="flex size-9 items-start justify-start rounded-[12px] bg-ink p-2 shadow-[0_2px_10px_rgba(0,0,0,.12)]"><span className="size-[7px] rounded-full bg-ink-contrast" /></span>
              <strong className="visitor-heading text-xl tracking-[-.04em] sm:text-[22px]">{siteName}</strong>
            </Link>
            <button autoFocus type="button" onClick={() => setOpen(false)} aria-label={language === "en" ? "Close menu" : "Menüyü kapat"} className="grid size-11 place-items-center rounded-full border border-line-strong bg-surface shadow-[0_2px_8px_rgba(0,0,0,.05)] transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav className="mx-auto flex min-h-[360px] w-full max-w-[960px] flex-1 flex-col justify-center py-8 sm:min-h-[430px] sm:py-12" aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"}>
            {items.map((item, index) => (
              <Link key={item.href} href={languageHref(item.href, language)} onClick={() => setOpen(false)} className="visitor-heading group -mx-3 flex items-center justify-between rounded-panel border-b border-line px-3 py-4 text-[30px] font-semibold leading-none tracking-[-.045em] transition-all hover:bg-surface hover:px-5 sm:-mx-5 sm:px-5 sm:py-5 sm:text-[46px] sm:hover:px-7">
                <span>{item[language]}</span>
                <span className="visitor-muted rounded-full border border-line-strong bg-surface px-2.5 py-1.5 text-[10px] font-bold tabular-nums tracking-[.14em] text-faint transition-colors group-hover:bg-surface-2 group-hover:text-ink">0{index + 1}</span>
              </Link>
            ))}
          </nav>

          <section className="mx-auto w-full max-w-[960px] rounded-panel border border-line bg-surface p-3 shadow-[0_12px_40px_rgba(0,0,0,.05)] sm:p-4" aria-label={language === "en" ? "Page settings" : "Sayfa ayarları"}>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="min-w-0 rounded-field bg-surface-2 p-4">
                <p className="visitor-copy mb-3 text-sm font-semibold">{language === "en" ? "Language" : "Dil"}</p>
                <LanguagePicker language={language} path={pathname} onNavigate={() => setOpen(false)} />
              </div>
              <div className="min-w-0 rounded-field bg-surface-2 p-4">
                <p className="visitor-copy mb-3 text-sm font-semibold">{language === "en" ? "Theme" : "Tema"}</p>
                <ThemePicker language={language} />
              </div>
              <div className="min-w-0 rounded-field bg-surface-2 p-4">
                <p className="visitor-copy mb-3 text-sm font-semibold">{language === "en" ? "Font" : "Yazı tipi"}</p>
                <FontPicker language={language} />
              </div>
              <div className="min-w-0 rounded-field bg-surface-2 p-4">
                <p className="visitor-copy mb-3 text-sm font-semibold">{language === "en" ? "Font size" : "Yazı boyutu"}</p>
                <FontSizePicker language={language} />
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
