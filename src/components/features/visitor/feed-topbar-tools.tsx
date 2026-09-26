"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FeedSearch } from "@/components/features/visitor/feed-search";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** The slot is part of the server-rendered bar, so it is there from the first client render on. */
function subscribe() { return () => {}; }

/**
 * The feed's search, placed in the top bar beside the site-wide controls rather than in a row of
 * icons of its own under them. The feed page owns it (other pages have nothing to search from), so
 * it is rendered here and handed to the slot the bar leaves open for it.
 */
export function FeedTopbarTools({ language }: { language: VisitorLanguage }) {
  const slot = useSyncExternalStore(subscribe, () => document.getElementById("visitor-topbar-slot"), () => null);
  return slot ? createPortal(<FeedSearch language={language} />, slot) : null;
}
