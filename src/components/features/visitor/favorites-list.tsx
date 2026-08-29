"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useSyncExternalStore } from "react";
import { NoteCard } from "@/components/features/visitor/note-card";
import { readFavorites, subscribeToFavorites } from "@/components/features/visitor/post-image-actions";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

function favoritesSnapshot() {
  return [...readFavorites()].sort().join(",");
}

export function FavoritesList({ posts, language }: { posts: Post[]; language: VisitorLanguage }) {
  const snapshot = useSyncExternalStore(subscribeToFavorites, favoritesSnapshot, () => "");
  const favoriteIds = new Set(snapshot ? snapshot.split(",") : []);
  const favorites = posts.filter((post) => favoriteIds.has(post.id));
  const isEnglish = language === "en";

  if (!favorites.length) {
    return (
      <div className="visitor-panel visitor-muted grid min-h-64 place-items-center rounded-panel border border-dashed border-line-strong px-6 py-14 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted"><Bookmark className="size-5" aria-hidden="true" /></span>
          <h2 className="mt-4 text-[18px] font-semibold text-ink">{isEnglish ? "No favorites yet" : "Henüz favori yok"}</h2>
          <p className="visitor-copy mt-2 text-[14px] leading-6 text-muted">{isEnglish ? "Save a post from its bookmark button and it will appear here." : "Bir yazıyı yer imi düğmesinden kaydedin; burada görünecek."}</p>
          <Link href={languageHref("/", language)} className="mt-5 inline-block border-b border-ink pb-1 font-mono text-[11px] font-medium uppercase tracking-[.14em] text-ink hover:border-accent hover:text-accent">
            {isEnglish ? "Browse posts" : "Yazılara göz at"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-[46px]">
      {favorites.map((post) => <NoteCard key={post.id} post={post} language={language} />)}
    </div>
  );
}
