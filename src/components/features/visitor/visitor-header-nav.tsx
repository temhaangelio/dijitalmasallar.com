"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const headerPaths = new Set(["/", "/about"]);

/** The 1b editorial header navigation; compact settings remain in the icon menu. */
export function VisitorHeaderNav({ language }: { language: VisitorLanguage }) {
  const pathname = usePathname();

  return (
    <nav className="mt-6 hidden items-center gap-[22px] sm:flex" aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"}>
      {visitorNavItems.filter((item) => headerPaths.has(item.href)).map((item) => {
        const current = pathname === item.href;
        const href = languageHref(item.href, language);
        const className = `border-b pb-1 font-mono text-[11px] font-bold leading-none uppercase tracking-[.12em] transition-colors ${
          current ? "border-ink text-ink" : "border-transparent text-muted hover:border-accent hover:text-accent"
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
