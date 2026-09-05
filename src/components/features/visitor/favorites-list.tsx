"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { NoteCard } from "@/components/features/visitor/note-card";
import { readFavorites, subscribeToFavorites } from "@/components/features/visitor/post-image-actions";
import { Skeleton } from "@/components/feedback/states";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function favoritesSnapshot() {
  return [...readFavorites()].sort().join(",");
}

/**
 * The reader's saved notes.
 *
 * The page used to be handed the last 500 notes and filter them here against `localStorage`, which
 * meant several hundred rows and their bodies crossed the wire on every visit so a handful could be
 * shown. The ids are the only thing the server is missing, so the ids are what gets sent: this asks
 * `/api/favorites` for exactly the notes that are saved, and asks again whenever the set changes.
 *
 * What has already been fetched is filtered against the live id set on every render rather than
 * waiting for a new answer, so un-saving a note from its own card here removes it at once instead
 * of leaving it on screen for a round trip.
 */
export function FavoritesList({ language }: { language: VisitorLanguage }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const snapshot = useSyncExternalStore(subscribeToFavorites, favoritesSnapshot, () => "");
  const [loaded, setLoaded] = useState<{ key: string; posts: Post[]; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${language}:${snapshot}`;
  const isEnglish = language === "en";

  /*
   * A stale reply is ignored rather than aborted.
   *
   * Aborting on cleanup looks tidier but leaves the list wedged on its skeleton under React's
   * development double-mount: the first request is cancelled mid-read, the rejection is caught, and
   * nothing ever sets the state. Discarding by flag is the pattern React's own docs use, and it
   * cannot orphan the render.
   */
  useEffect(() => {
    if (!snapshot) return;
    let ignore = false;
    const requestKey = `${language}:${snapshot}`;
    fetch(`/api/favorites?ids=${encodeURIComponent(snapshot)}&lang=${language}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: { posts?: Post[] }) => { if (!ignore) setLoaded({ key: requestKey, posts: data.posts ?? [], failed: false }); })
      .catch(() => { if (!ignore) setLoaded({ key: requestKey, posts: [], failed: true }); });
    return () => { ignore = true; };
  }, [snapshot, language, attempt]);

  const savedIds = new Set(snapshot ? snapshot.split(",") : []);
  const visible = (loaded?.posts ?? []).filter((post) => savedIds.has(post.id));

  const emptyState = (
    <div className="visitor-card grid min-h-64 place-items-center px-6 py-10 text-center sm:py-12">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-2 text-muted"><Bookmark className="size-5" aria-hidden="true" /></span>
        <h2 className="visitor-heading visitor-serif mt-4 text-[length:var(--vt-h3)] font-normal leading-[1.3] tracking-normal text-ink">{isEnglish ? "No favorites yet" : "Okumalık notların burada"}</h2>
        <p className="visitor-copy mx-auto mt-2 max-w-[38ch] text-[length:var(--vt-small)] font-normal leading-6 text-muted">{isEnglish ? "Save a note from the bookmark button on its card and it will appear here." : "Akışta ilgini çeken bir notu yer imi düğmesiyle kaydet. Sonra buradan devam et."}</p>
        <Link href={languageHref("/", language)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-ink-contrast transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
          {isEnglish ? "Browse posts" : "Akışı keşfet"}
        </Link>
      </div>
    </div>
  );

  if (hydrated && !snapshot) return emptyState;

  /*
   * The server renders this without a snapshot — `localStorage` is not its to read — so the first
   * client paint is a skeleton rather than an empty state that would be wrong for most readers and
   * would flash away a moment later. It also stands in while an answer for a newly saved note is
   * still on its way.
   */
  if (!hydrated || (!visible.length && loaded?.key !== key)) {
    return (
      <div className="flex flex-col gap-7 sm:gap-9" role="status" aria-label={isEnglish ? "Loading favorites" : "Favoriler yükleniyor"}>
        {/* Shaped like the notes it stands in for — text, then a cover — so the page does not
            jump when the answer arrives. */}
        {[0, 1].map((index) => (
          <div key={index} className="visitor-card">
            <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[64%]" />
              <Skeleton className="mt-3 aspect-video w-full rounded-[10px]" />
              <Skeleton className="mt-1 h-8 w-24 self-end" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* Saved notes that could not be fetched are not the same thing as no saved notes, and the reader
     should not be told their list is empty because the network dropped. */
  if (!visible.length && loaded?.failed) {
    return (
      <div className="visitor-card grid min-h-64 place-items-center px-6 py-10 text-center sm:py-12">
        <div>
          <p className="visitor-copy mx-auto max-w-[38ch] text-[length:var(--vt-small)] font-normal leading-6 text-muted">
            {isEnglish ? "Your saved posts could not be loaded." : "Notların yüklenemedi. Lütfen yeniden dene."}
          </p>
          <button type="button" onClick={() => { setLoaded(null); setAttempt((current) => current + 1); }} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-ink-contrast transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
            {isEnglish ? "Try again" : "Yeniden dene"}
          </button>
        </div>
      </div>
    );
  }

  if (!visible.length) return (
    <div className="visitor-card px-6 py-10 text-center">
      <p className="text-sm leading-6 text-muted">{isEnglish ? "No saved notes are available in this language. They may have been removed or saved in another language." : "Bu dilde gösterilebilen kayıtlı not yok. Notlar diğer dilde kaydedilmiş veya yayından kaldırılmış olabilir."}</p>
      <Link href={languageHref("/", language)} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">{isEnglish ? "Back to feed" : "Akışa dön"}</Link>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-7 sm:gap-9">
        {visible.map((post) => <NoteCard key={post.id} post={post} language={language} />)}
      </div>
      {/* Worth saying once, at the end rather than over the list: this is not an account, and
          clearing the browser clears it. */}
      <p className="visitor-muted mt-7 text-center visitor-sans text-[11px] font-normal leading-[1.6] text-muted sm:mt-12">
        {isEnglish
          ? `${visible.length} ${visible.length === 1 ? "note" : "notes"}, saved on this device.`
          : `${visible.length} not, bu cihazda saklanıyor.`}
      </p>
    </>
  );
}
