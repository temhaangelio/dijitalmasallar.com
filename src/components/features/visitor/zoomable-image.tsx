"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, X, ZoomIn } from "lucide-react";
import type { VisitorLanguage } from "@/lib/visitor-language";

export function ZoomableImage({ src, alt, language, className, children }: {
  src: string; alt: string; language: VisitorLanguage; className: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={`${className} group/image cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`} aria-label={language === "en" ? "Enlarge image" : "Görseli büyüt"} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      {children}
      <span aria-hidden="true" className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-black/50 text-white opacity-80 transition-opacity group-hover/image:opacity-100"><ZoomIn size={16} /></span>
    </button>
    {open && createPortal(<ImagePreview src={src} alt={alt} language={language} onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function ImagePreview({ src, alt, language, onClose }: { src: string; alt: string; language: VisitorLanguage; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const isEnglish = language === "en";
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement as HTMLElement | null;
    const { body } = document;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    element.showModal();
    return () => {
      element.close();
      body.style.overflow = overflow;
      body.style.paddingRight = padding;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return <dialog ref={dialog} aria-label={isEnglish ? "Image preview" : "Görsel önizleme"} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-4 text-white backdrop:bg-black/90 open:flex open:items-center open:justify-center sm:p-10">
    <button type="button" autoFocus onClick={onClose} aria-label={isEnglish ? "Close image" : "Görseli kapat"} className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-neutral-800 text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-6 sm:top-6"><X size={20} /></button>
    {state === "loading" && <span role="status" className="pointer-events-none absolute flex items-center gap-2 text-sm text-white"><LoaderCircle size={20} className="animate-spin motion-reduce:animate-none" />{isEnglish ? "Loading image…" : "Görsel yükleniyor…"}</span>}
    {state === "error" ? <p role="alert" className="text-center text-sm text-white">{isEnglish ? "The image could not be loaded. Please close and try again." : "Görsel yüklenemedi. Kapatıp tekrar deneyin."}</p> :
      // eslint-disable-next-line @next/next/no-img-element -- original image is fetched only when the preview opens
      <img src={src} alt={alt} onLoad={() => setState("ready")} onError={() => setState("error")} className={`max-h-[calc(100dvh-144px)] max-w-full rounded-lg object-contain ${state === "loading" ? "opacity-0" : "opacity-100"}`} />}
  </dialog>;
}
