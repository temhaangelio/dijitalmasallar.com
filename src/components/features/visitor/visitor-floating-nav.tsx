"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The header's navigation, back within reach.
 *
 * A long feed leaves the masthead several screens above. Feed page only: a capsule pinned to the
 * bottom edge with the way back to the top first, then the two other pages. It appears on the way
 * back up, once the masthead has scrolled out of view, so at the top of the page nothing is doubled.
 */
export function VisitorFloatingNav({ language }: { language: VisitorLanguage }) {
  const [shown, setShown] = useState(false);
  const isEnglish = language === "en";

  /*
   * Shown the way a phone browser shows its toolbar: only while scrolling back up, and only once
   * the masthead is out of view. Scrolling down to read keeps the bottom edge clear; the first
   * upward move brings the links, since going up is usually going somewhere.
   */
  useEffect(() => {
    const masthead = document.querySelector(".visitor-masthead");
    let belowMasthead = false;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      // Small jitters from momentum and rubber-banding do not count as a change of direction.
      if (Math.abs(delta) < 6) return;
      lastY = y;
      setShown(belowMasthead && delta < 0);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const observer = masthead
      ? new IntersectionObserver(([entry]) => { belowMasthead = !entry?.isIntersecting; if (!belowMasthead) setShown(false); }, { rootMargin: "-1px 0px 0px 0px" })
      : null;
    if (masthead) observer?.observe(masthead);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer?.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <nav aria-label={isEnglish ? "Quick navigation" : "Hızlı gezinme"} data-shown={shown || undefined} className="visitor-float-nav visitor-sans" aria-hidden={!shown}>
      <div className="visitor-float-track">
        <button type="button" onClick={scrollToTop} tabIndex={shown ? undefined : -1} className="visitor-float-top">
          <ArrowUp size={16} strokeWidth={2} aria-hidden="true" />
          <span>{isEnglish ? "Top" : "Başa dön"}</span>
        </button>
        <span className="visitor-float-rule" aria-hidden="true" />
        {visitorNavItems.filter((item) => item.href !== "/").map((item) => (
          <Link key={item.href} href={languageHref(item.href, language)} tabIndex={shown ? undefined : -1} className="visitor-float-link">
            {item[language]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
