"use client";

import Link from "next/link";
import { ListenLink } from "./listen-modal";
import { NewsletterLink } from "./newsletter-modal";
import { usePathname } from "next/navigation";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const headerPaths = new Set(["/", "/podcast", "/ebulten"]);

/** A single, shared navigation group below the wordmark and tagline. */
export function VisitorHeaderNav({ language }: { language: VisitorLanguage }) {
  const pathname = usePathname();

  return (
    <nav className="visitor-header-links" aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"}>
      <div className="visitor-nav-track">
      {visitorNavItems.filter((item) => headerPaths.has(item.href)).map((item) => {
        const NavLink = item.href === "/podcast" ? ListenLink : item.href === "/ebulten" ? NewsletterLink : Link;
        const current = pathname === item.href;
        const href = languageHref(item.href, language);
        const className = "visitor-header-link visitor-sans";
        return (
          <NavLink
            key={item.href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={className}
          >
            {item[language]}
          </NavLink>
        );
      })}
      </div>
    </nav>
  );
}
