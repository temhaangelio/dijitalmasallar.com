"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { readFavorites, subscribeToFavorites } from "@/components/features/visitor/post-image-actions";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * Saved notes, as one of the masthead's controls rather than a word in the navigation.
 *
 * It takes the same 44px chip as the bell and the settings beside it. The count is only known to
 * the reader's own browser, so the server renders none and the badge appears on hydration; the
 * mark fills in once there is something saved, which is the state worth seeing at a glance.
 */
export function FavoritesNavButton({ language }: { language: VisitorLanguage }) {
  const count = useSyncExternalStore(subscribeToFavorites, () => readFavorites().size, () => 0);
  const pathname = usePathname();
  const isEnglish = language === "en";
  const label = count
    ? (isEnglish ? `Favorites (${count})` : `Favoriler (${count})`)
    : (isEnglish ? "Favorites" : "Favoriler");
  const active = pathname === "/favoriler";

  return (
    <Link
      href={languageHref("/favoriler", language)}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className="visitor-top-control"
    >
      <Bookmark size={18} strokeWidth={1.8} className={count ? "fill-current" : ""} aria-hidden="true" />
      {count ? <span className="visitor-top-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
