"use client";

import { useSyncExternalStore } from "react";
import { Bookmark, Share2 } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import type { VisitorLanguage } from "@/lib/visitor-language";

const favoritesStorageKey = "diji-news:favorites:v1";
const favoritesChangedEvent = "diji-news:favorites-change";

function readFavorites() {
  try {
    const value = JSON.parse(window.localStorage.getItem(favoritesStorageKey) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function subscribeToFavorites(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(favoritesChangedEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(favoritesChangedEvent, onStoreChange);
  };
}

export function PostImageActions({ postId, href, title, language }: { postId: string; href: string; title: string; language: VisitorLanguage }) {
  const favorite = useSyncExternalStore(
    subscribeToFavorites,
    () => readFavorites().has(postId),
    () => false,
  );
  const shareLabel = language === "en" ? "Share post" : "Yazıyı paylaş";
  const favoriteLabel = favorite
    ? (language === "en" ? "Remove from favorites" : "Favorilerden çıkar")
    : (language === "en" ? "Add to favorites" : "Favorilere ekle");

  async function sharePost() {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) {
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

  const buttonClass = "grid size-10 place-items-center text-ink transition-colors hover:bg-surface-2 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink";

  return (
    <div className="absolute right-3 top-3 z-20 flex items-center overflow-hidden rounded-full border border-line-strong/70 bg-surface/90 shadow-[0_5px_20px_rgba(21,21,15,.12)] backdrop-blur-md">
      <button type="button" onClick={sharePost} aria-label={shareLabel} title={shareLabel} className={`${buttonClass} rounded-l-full`}>
        <Share2 className="size-[17px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
      <span className="h-5 w-px bg-line-strong/80" aria-hidden="true" />
      <button
        type="button"
        onClick={toggleFavorite}
        aria-label={favoriteLabel}
        title={favoriteLabel}
        aria-pressed={favorite}
        className={`${buttonClass} rounded-r-full ${favorite ? "bg-surface-2 text-accent" : ""}`}
      >
        <Bookmark className={`size-[17px] ${favorite ? "fill-current" : ""}`} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
