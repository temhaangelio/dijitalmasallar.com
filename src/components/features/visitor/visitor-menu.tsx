"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const items = [
  { href: "/", tr: "Akış", en: "Feed" },
  { href: "/newsletter", tr: "E-bülten", en: "Newsletter" },
  { href: "/about", tr: "Hakkında", en: "About" },
  { href: "/contact", tr: "İletişim", en: "Contact" },
] as const;

export function VisitorMenu({ language, siteName }: { language: VisitorLanguage; siteName: string }) {
  const [open, setOpen] = useState(false);
  const isEnglish = language === "en";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={language === "en" ? "Open menu" : "Menüyü aç"} aria-expanded={open} className="grid size-9 place-items-center rounded-[12px] bg-ink text-ink-contrast shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-all hover:-translate-y-px hover:opacity-80 hover:shadow-soft">
        <Menu size={18} aria-hidden="true" />
      </button>

      <VisitorBottomSheet open={open} onOpenChange={setOpen} title={siteName} closeLabel={isEnglish ? "Close menu" : "Menüyü kapat"}>
        <nav className="grid gap-2 sm:grid-cols-2" aria-label={isEnglish ? "Main navigation" : "Ana navigasyon"}>
          {items.map((item, index) => (
            <Link key={item.href} href={languageHref(item.href, language)} onClick={() => setOpen(false)} className="visitor-heading group flex min-h-20 items-center justify-between rounded-field bg-surface px-5 py-4 text-[24px] font-semibold tracking-[-.04em] transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft sm:min-h-24 sm:text-[28px]">
              <span>{item[language]}</span>
              <span className="visitor-muted text-[10px] font-bold tabular-nums tracking-[.14em] text-faint">0{index + 1}</span>
            </Link>
          ))}
        </nav>
      </VisitorBottomSheet>
    </>
  );
}
