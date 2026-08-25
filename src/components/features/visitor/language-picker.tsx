"use client";

import Link from "next/link";
import { Segmented, segmentClassName } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const languages: { value: VisitorLanguage; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

/**
 * Plain links rather than a client-side switch: the language already travels through the `?lang`
 * query parameter on every internal link, so the server keeps deciding what to render.
 */
export function LanguagePicker({ language, path = "/about", onNavigate }: { language: VisitorLanguage; path?: string; onNavigate?: () => void }) {
  return (
    <Segmented className="w-full sm:w-fit" role="group" label={language === "en" ? "Language" : "Dil"}>
      {languages.map((item) => {
        const selected = item.value === language;
        return (
          <Link
            key={item.value}
            // Keep the default language explicit for this one navigation. The proxy records it in
            // a cookie, then ordinary English links can go back to their clean parameter-less URLs.
            href={item.value === "en" ? `${languageHref(path, item.value)}${path.includes("?") ? "&" : "?"}lang=en` : languageHref(path, item.value)}
            hrefLang={item.value}
            onClick={onNavigate}
            aria-label={item.label}
            aria-current={selected ? "true" : undefined}
            title={item.label}
            data-active={selected}
            className={cn(segmentClassName(selected), "flex-1 justify-center px-3.5 sm:flex-none")}
          >
            {item.label}
          </Link>
        );
      })}
    </Segmented>
  );
}
