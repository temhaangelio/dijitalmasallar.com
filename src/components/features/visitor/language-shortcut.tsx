"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The language switch, lifted out of the settings sheet and into the header.
 *
 * Two reasons. The site is published in two languages and the control for choosing one sat two taps
 * deep, behind an icon that gives no hint it is in there. And the utility row needed something on
 * its left: with only the bell and the gear it was a bar with one end furnished and the other empty.
 *
 * It is a plain link rather than a toggle, like the picker in the sheet — the language travels in
 * `?lang=`, so the server keeps deciding what to render. The full picker stays in the sheet, where
 * both languages are named rather than abbreviated.
 */
export function LanguageShortcut({ language }: { language: VisitorLanguage }) {
  const pathname = usePathname();
  const next: VisitorLanguage = language === "en" ? "tr" : "en";
  // Named in the language it leads to, the way the sheet's picker names its options.
  const label = next === "en" ? "English" : "Türkçe";
  return (
    <Link
      href={languageHref(pathname, next)}
      hrefLang={next}
      aria-label={label}
      title={label}
      className="visitor-top-control font-mono text-[11px] font-semibold uppercase leading-none tracking-[.06em]"
    >
      <span aria-hidden="true">{next}</span>
    </Link>
  );
}
