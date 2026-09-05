"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const headerPaths = new Set(["/", "/about", "/favoriler"]);

/** The 1b editorial header navigation; compact settings remain in the icon menu. */
export function VisitorHeaderNav({ language }: { language: VisitorLanguage }) {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex items-center gap-6 sm:mt-7 sm:gap-8" aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"}>
      {visitorNavItems.filter((item) => headerPaths.has(item.href)).map((item) => {
        const current = pathname === item.href;
        const href = languageHref(item.href, language);
        const className = `visitor-tap border-b pb-1.5 visitor-sans text-[12px] font-semibold leading-none uppercase tracking-[.16em] transition-colors sm:text-[13px] ${
          current ? "border-accent text-accent" : "border-transparent text-muted hover:border-accent hover:text-accent"
        }`;
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={className}
          >
            {item[language]}
          </Link>
        );
      })}
    </nav>
  );
}
