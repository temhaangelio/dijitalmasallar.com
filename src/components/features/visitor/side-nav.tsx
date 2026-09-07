"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { PushNavButton } from "@/components/features/visitor/push";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const sideNavPaths = new Set(["/", "/about", "/favoriler"]);

/**
 * The navigation that takes over the left margin once the masthead has scrolled away.
 *
 * The centred masthead is the site's face and stays exactly as it is — but it is only on screen for
 * the first screenful, and after that there was no way to the other pages, to the settings, or back
 * to the brief without scrolling all the way up. Everything the header holds is here, in the margin
 * that was empty anyway.
 *
 * It waits for the masthead to leave rather than appearing at the top, because a page that names
 * itself twice at once, in two places, reads as a mistake.
 */
export function VisitorSideNav({
  language,
  siteName,
  showPush,
  pushPublicKey,
  brief,
}: {
  language: VisitorLanguage;
  siteName: string;
  showPush: boolean;
  pushPublicKey: string;
  /** The feed's daily brief, when the page has one. Given by the server so the label needs no DOM read. */
  brief?: { label: string; count: number };
}) {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    const masthead = document.querySelector(".visitor-nav");
    if (!masthead) return;

    /*
     * A hair of hysteresis: it arrives once the masthead is fully gone and leaves only when a
     * little of it is back. Without the gap, parking the scroll exactly on the threshold makes it
     * blink on every stray wheel tick.
     */
    const update = () => {
      const bottom = masthead.getBoundingClientRect().bottom;
      const next = shownRef.current ? bottom < 24 : bottom < -8;
      if (next === shownRef.current) return;
      shownRef.current = next;
      setShown(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function openBrief() {
    const element = document.querySelector<HTMLDetailsElement>("details.group\\/brief");
    if (!element) return;
    element.open = true;
    element.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const tabIndex = shown ? undefined : -1;

  return (
    <div className="visitor-side-nav" data-shown={shown ? "true" : "false"} aria-hidden={!shown}>
      <Link
        href={languageHref("/", language)}
        tabIndex={tabIndex}
        aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
        className="visitor-side-brand"
      >
        <BrandMark className="visitor-logo-mark block shrink-0 !size-9 !rounded-[12px]" />
        <span className="visitor-side-brand-name">{siteName}</span>
      </Link>

      <nav aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"}>
        <ul className="visitor-side-links">
          {visitorNavItems.filter((item) => sideNavPaths.has(item.href)).map((item, index) => {
            const current = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={languageHref(item.href, language)}
                  tabIndex={tabIndex}
                  aria-current={current ? "page" : undefined}
                  className="visitor-side-link"
                >
                  {/* The numeral is the site's own motif — the mark is a pair of binary digits and
                      the masthead drifts with 0s and 1s — carried down into the margin. */}
                  <span className="visitor-side-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item[language]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {brief ? (
        <button type="button" onClick={openBrief} tabIndex={tabIndex} className="visitor-side-brief">
          <span className="visitor-side-brief-label">{brief.label}</span>
          <span className="visitor-side-brief-count">{brief.count}</span>
        </button>
      ) : null}

      <div className="visitor-side-tools">
        {showPush ? <PushNavButton language={language} publicKey={pushPublicKey} /> : null}
        <VisitorMenu language={language} pushPublicKey={pushPublicKey} />
      </div>
    </div>
  );
}
