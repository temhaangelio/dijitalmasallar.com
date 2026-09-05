"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The language switch, in the footer.
 *
 * A plain link rather than a toggle, like the picker in the settings sheet: the language travels in
 * `?lang=`, so the server keeps deciding what to render, and the current path is carried across so
 * the reader lands on the same page in the other language. The sheet keeps the full picker, where
 * both languages are named side by side.
 */
export function LanguageLink({ language }: { language: VisitorLanguage }) {
  const pathname = usePathname();
  const next: VisitorLanguage = language === "en" ? "tr" : "en";
  const label = next === "en" ? "English" : "Türkçe";
  return (
    <Link
      href={languageHref(pathname, next)}
      hrefLang={next}
      lang={next}
      className="visitor-tap visitor-sans text-[11px] font-normal text-muted transition-colors hover:text-accent"
    >
      {label}
    </Link>
  );
}
