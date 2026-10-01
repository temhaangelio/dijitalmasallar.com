"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import type { VisitorLanguage } from "@/lib/visitor-language";

/**
 * The way back to the top of a long feed: one round button in the bottom corner. It appears on
 * the way back up, once the masthead has scrolled out of view, and is gone at the top.
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
    <div data-shown={shown || undefined} className="feed-float-top" aria-hidden={!shown}>
      <button type="button" onClick={scrollToTop} tabIndex={shown ? undefined : -1} className="feed-float-top-button" aria-label={isEnglish ? "Back to top" : "Başa dön"} title={isEnglish ? "Back to top" : "Başa dön"}>
        <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
