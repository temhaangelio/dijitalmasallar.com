"use client";

import { useEffect } from "react";

/** Where the reader was in the feed when they opened a note, kept for the length of the tab. */
export const feedPositionKey = "visitor:feed-position";
/** Set by the story page's "back to feed" link, so only that route home restores the position. */
export const feedRestoreKey = "visitor:feed-restore";

type FeedPosition = { href: string; y: number };

export function readFeedPosition(): FeedPosition | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(feedPositionKey) ?? "null");
    return value && typeof value.href === "string" && typeof value.y === "number" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Opening a note and coming back should land where the reader left off, not at the top of a
 * feed they had scrolled for a while. The position is noted when a note is opened; the story
 * page's "back to feed" link returns to the same feed address (its `limit` included, so the same
 * notes are on the page) and sets a flag, and the flag is what allows the jump — the "Akış" link
 * in the masthead still goes to the top, as a link to a page should.
 */
export function FeedScrollMemory() {
  useEffect(() => {
    const remember = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".visitor-card-link")) return;
      try {
        sessionStorage.setItem(feedPositionKey, JSON.stringify({ href: location.pathname + location.search, y: window.scrollY }));
      } catch { /* Storage may be unavailable; the reader simply lands at the top. */ }
    };
    document.addEventListener("click", remember, true);

    let restore: FeedPosition | null = null;
    try {
      if (sessionStorage.getItem(feedRestoreKey)) {
        sessionStorage.removeItem(feedRestoreKey);
        restore = readFeedPosition();
      }
    } catch { /* ignore */ }
    if (restore && restore.href === location.pathname + location.search) {
      const y = restore.y;
      // Two frames: one for the feed to lay out, one for the covers to claim their boxes.
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" })));
    }

    return () => document.removeEventListener("click", remember, true);
  }, []);
  return null;
}
