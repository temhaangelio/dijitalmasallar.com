"use client";

import { useSyncExternalStore } from "react";
import { Bookmark, Share2 } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import type { VisitorLanguage } from "@/lib/visitor-language";

export const favoritesStorageKey = "diji-news:favorites:v1";
export const favoritesChangedEvent = "diji-news:favorites-change";

export function readFavorites() {
  try {
    const value = JSON.parse(window.localStorage.getItem(favoritesStorageKey) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function subscribeToFavorites(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(favoritesChangedEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(favoritesChangedEvent, onStoreChange);
  };
}

/*
 * Whether this is a device that should be offered the system share sheet.
 *
 * `navigator.share` exists on desktop Safari and Chrome too, so the button was handing a mouse user
 * an OS share panel when what they wanted was the link. A coarse pointer is the honest test: on a
 * phone the sheet is the native way to pass something on, and on a desktop copying is.
 *
 * The query lives at module scope because the feed renders this on every card — one media query
 * with a set of subscribers rather than twenty of them.
 */
const coarsePointer = typeof window === "undefined" ? null : window.matchMedia("(pointer: coarse)");

function subscribeToPointer(onStoreChange: () => void) {
  coarsePointer?.addEventListener("change", onStoreChange);
  return () => coarsePointer?.removeEventListener("change", onStoreChange);
}

export function PostImageActions({
  postId,
  href,
  title,
  language,
  placement = "overlay",
}: {
  postId: string;
  href: string;
  title: string;
  language: VisitorLanguage;
  placement?: "overlay" | "inline";
}) {
  const favorite = useSyncExternalStore(
    subscribeToFavorites,
    () => readFavorites().has(postId),
    () => false,
  );
  // The server cannot know the pointer, and guesses desktop; a phone corrects it on hydration. Only
  // the button's label depends on it, so there is nothing visible to correct.
  const touch = useSyncExternalStore(subscribeToPointer, () => coarsePointer?.matches ?? false, () => false);
  const shareLabel = touch
    ? (language === "en" ? "Share post" : "Yazıyı paylaş")
    : (language === "en" ? "Copy link" : "Bağlantıyı kopyala");
  const favoriteLabel = favorite
    ? (language === "en" ? "Remove from favorites" : "Favorilerden çıkar")
    : (language === "en" ? "Add to favorites" : "Favorilere ekle");

  async function sharePost() {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (touch && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(language === "en" ? "Post link copied." : "Yazı bağlantısı kopyalandı.", "success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast(language === "en" ? "The post could not be shared." : "Yazı paylaşılamadı.", "error");
    }
  }

  function toggleFavorite() {
    const favorites = readFavorites();
    if (favorites.has(postId)) favorites.delete(postId);
    else favorites.add(postId);
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites]));
    window.dispatchEvent(new Event(favoritesChangedEvent));
    showToast(
      favorites.has(postId)
        ? (language === "en" ? "Added to favorites." : "Favorilere eklendi.")
        : (language === "en" ? "Removed from favorites." : "Favorilerden çıkarıldı."),
      "success",
    );
  }

  // Keep controls at least 44px for touch, including tablets.
  const buttonClass = "grid size-11 place-items-center text-muted transition-colors hover:bg-surface-2 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink";
  const placementClass = placement === "overlay"
    ? "absolute right-3 top-3 border border-line-strong/70 bg-surface/90 shadow-sm backdrop-blur-md"
    : "relative shrink-0 gap-1";

  return (
    <div className={`${placementClass} z-20 flex items-center overflow-hidden rounded-full`}>
      <button type="button" onClick={sharePost} aria-label={shareLabel} title={shareLabel} className={`${buttonClass} rounded-full`}>
        <Share2 className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
      {placement === "overlay" ? <span className="h-5 w-px bg-line-strong/80" aria-hidden="true" /> : null}
      <button
        type="button"
        onClick={toggleFavorite}
        aria-label={favoriteLabel}
        title={favoriteLabel}
        aria-pressed={favorite}
        className={`${buttonClass} rounded-full ${favorite ? "bg-surface-2 text-accent" : ""}`}
      >
        <Bookmark className={`size-[17px] ${favorite ? "fill-current" : ""}`} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
