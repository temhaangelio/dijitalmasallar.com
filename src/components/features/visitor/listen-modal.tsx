"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { Headphones, LoaderCircle } from "lucide-react";
import { loadListeningQueue } from "@/app/dinle/actions";
import { AudioPlaylist, type PlaylistItem } from "./audio-playlist";
import { VisitorBottomSheet } from "./visitor-bottom-sheet";
import { Button } from "@/components/ui/button";
import { resolveVisitorLanguage, type VisitorLanguage } from "@/lib/visitor-language";

const eventName = "visitor:open-listening";
type Selection = { language: VisitorLanguage; day?: string; autoPlay: boolean };

export function ListenLink({ href, children, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  return <a {...props} href={href} aria-haspopup="dialog" onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(href, window.location.href);
    window.dispatchEvent(new CustomEvent<Selection>(eventName, { detail: { language: resolveVisitorLanguage(url.searchParams.get("lang")), day: url.searchParams.get("day") ?? undefined, autoPlay: url.searchParams.get("play") === "1" } }));
  }}>{children}</a>;
}

export function ListenModal() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [result, setResult] = useState<{ items: PlaylistItem[]; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const close = useCallback((open: boolean) => { if (!open) setSelection(null); }, []);
  useEffect(() => {
    const open = (event: Event) => { setResult(null); setSelection((event as CustomEvent<Selection>).detail); };
    window.addEventListener(eventName, open);
    return () => window.removeEventListener(eventName, open);
  }, []);
  useEffect(() => {
    if (!selection) return;
    let cancelled = false;
    void loadListeningQueue(selection.language).then(value => { if (!cancelled) setResult(value); }).catch(() => { if (!cancelled) setResult({ items: [], error: true }); });
    return () => { cancelled = true; };
  }, [selection, attempt]);
  if (!selection) return null;
  const english = selection.language === "en";
  return <VisitorBottomSheet open title={english ? "Listen" : "Dinle"} closeLabel={english ? "Close player" : "Oynatıcıyı kapat"} onOpenChange={close} panelClassName="listen-modal !max-w-[1000px] visitor-sans" titleClassName="text-xl font-semibold tracking-tight">
    {!result ? <p role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted"><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />{english ? "Loading recordings…" : "Kayıtlar yükleniyor…"}</p>
      : result.error ? <div className="py-8 text-center"><p role="alert" className="mb-4 text-sm text-danger">{english ? "Recordings could not be loaded." : "Kayıtlar yüklenemedi."}</p><Button variant="secondary" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>{english ? "Try again" : "Yeniden dene"}</Button></div>
        : result.items.length ? <AudioPlaylist key={`${selection.language}-${selection.day ?? ""}`} items={result.items} language={selection.language} initialDay={selection.day} autoPlay={selection.autoPlay} />
          : <div className="py-10 text-center text-muted"><Headphones className="mx-auto mb-3 size-8" /><p className="text-sm">{english ? "No published recordings yet." : "Henüz yayımlanmış kayıt yok."}</p></div>}
  </VisitorBottomSheet>;
}
