import Link from "next/link";
import type { VisitorLanguage } from "@/lib/visitor-language";

const languages: { value: VisitorLanguage; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

/**
 * Plain links rather than a client-side switch: the language already travels through the `?lang`
 * query parameter on every internal link, so the server keeps deciding what to render.
 */
export function LanguagePicker({ language, path = "/hakkinda" }: { language: VisitorLanguage; path?: string }) {
  return (
    <div className="flex gap-1 rounded-full bg-surface-2 p-1">
      {languages.map((item) => {
        const selected = item.value === language;
        return (
          <Link
            key={item.value}
            href={`${path}?lang=${item.value}`}
            hrefLang={item.value}
            aria-current={selected ? "true" : undefined}
            className={`flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors ${selected ? "bg-ink text-ink-contrast" : "text-muted hover:text-ink"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
