"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { readFavorites, subscribeToFavorites } from "@/components/features/visitor/post-image-actions";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

export function FavoritesNavButton({ language }: { language: VisitorLanguage }) {
  const count = useSyncExternalStore(subscribeToFavorites, () => readFavorites().size, () => 0);
  const pathname = usePathname();
  const isEnglish = language === "en";
  const label = isEnglish ? `Favorites (${count})` : `Favoriler (${count})`;
  const active = pathname === "/favoriler";

  return (
    <Link
      href={languageHref("/favoriler", language)}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative grid size-9 place-items-center rounded-[12px] text-ink-contrast shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-all hover:-translate-y-px hover:opacity-80 hover:shadow-soft ${active ? "bg-accent" : "bg-ink"}`}
    >
      <Bookmark size={17} className={count ? "fill-current" : ""} aria-hidden="true" />
      {count ? (
        <span className="absolute -right-1.5 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 visitor-sans text-[9px] font-bold leading-none text-white" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
