"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const items = [
  { href: "/", tr: "Akış", en: "Feed" },
  { href: "/newsletter", tr: "E-bülten", en: "Newsletter" },
  { href: "/about", tr: "Hakkında", en: "About" },
  { href: "/settings", tr: "Ayarlar", en: "Settings" },
  { href: "/contact", tr: "İletişim", en: "Contact" },
] as const;

export function VisitorMenu({ language, siteName }: { language: VisitorLanguage; siteName: string }) {
  const [open, setOpen] = useState(false);

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
        <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-canvas px-5 pb-8 pt-5 text-ink" role="dialog" aria-modal="true" aria-label={language === "en" ? "Site menu" : "Site menüsü"}>
          <div className="mx-auto flex w-full max-w-[960px] items-center justify-between py-3">
            <Link href={languageHref("/", language)} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-full">
              <span aria-hidden="true" className="flex size-8 items-start justify-start rounded-[11px] bg-ink p-[7px]"><span className="size-[7px] rounded-full bg-ink-contrast" /></span>
              <strong className="visitor-heading text-base tracking-[-.03em]">{siteName}</strong>
            </Link>
            <button autoFocus type="button" onClick={() => setOpen(false)} aria-label={language === "en" ? "Close menu" : "Menüyü kapat"} className="grid size-11 place-items-center rounded-full border border-line-strong bg-surface transition-colors hover:bg-surface-2">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav className="mx-auto flex w-full max-w-[960px] flex-1 flex-col justify-center py-10" aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"}>
            {items.map((item, index) => (
              <Link key={item.href} href={languageHref(item.href, language)} onClick={() => setOpen(false)} className="visitor-heading group flex items-center justify-between border-b border-line py-4 text-[32px] font-semibold leading-none tracking-[-.045em] transition-colors hover:text-muted sm:py-5 sm:text-[48px]">
                <span>{item[language]}</span>
                <span className="visitor-muted text-[11px] font-bold tabular-nums tracking-[.14em] text-faint">0{index + 1}</span>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
