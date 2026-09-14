"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

type Result = { id: string; title: string; excerpt: string; date: string };

export function FeedSearch({ language }: { language: VisitorLanguage }) {
  const english = language === "en";
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ query: string; items: Result[]; error?: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const search = query.trim();
  const ready = result?.query === search;
  const items = ready ? result.items : [];
  const loading = search.length >= 2 && !ready;
  const show = useCallback(() => {
    dialog.current?.showModal();
    setOpen(true);
    input.current?.focus();
  }, []);
  const close = () => dialog.current?.close();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !document.querySelector('[role="dialog"]')) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open || search.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?${new URLSearchParams({ q: search, lang: language })}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json() as { items: Result[] };
        if (!controller.signal.aborted) setResult({ query: search, items: data.items });
      } catch {
        if (!controller.signal.aborted) setResult({ query: search, items: [], error: true });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, search, language]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId, open]);

  return <>
    <button type="button" className="visitor-feed-view-picker visitor-search-trigger" aria-label={english ? "Search the site" : "Sitede ara"} title={english ? "Search (⌘K / Ctrl+K)" : "Ara (⌘K / Ctrl+K)"} aria-haspopup="dialog" onClick={show}><Search size={18} strokeWidth={1.7} aria-hidden="true" /></button>
    <dialog ref={dialog} className="visitor-search visitor-sans" aria-label={english ? "Search the site" : "Sitede ara"} onClose={() => setOpen(false)} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
      <div className="visitor-search-input-row">
        <Search size={22} aria-hidden="true" />
        <input ref={input} value={query} maxLength={100} placeholder={english ? "Search news…" : "Haberlerde ara…"} aria-label={english ? "Search news" : "Haberlerde ara"} role="combobox" aria-autocomplete="list" aria-expanded={items.length > 0} aria-controls={listId} aria-activedescendant={items[active] ? `${listId}-${active}` : undefined} onChange={event => { setQuery(event.target.value); setActive(0); setResult(null); }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && items.length) {
            event.preventDefault();
            setActive(index => (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
          }
          if (event.key === "Enter" && items[active]) {
            event.preventDefault();
            close();
            router.push(languageHref(`/haber/${items[active].id}`, language));
          }
        }} />
        <button type="button" aria-label={english ? "Close search" : "Aramayı kapat"} onClick={close}><X size={19} /></button>
      </div>
      <div className="visitor-search-results">
        <p className="visitor-search-status" role="status">{search.length < 2 ? (english ? "Search the archive by topic, brand or keyword." : "Konu, marka veya kelimeyle tüm haber arşivinde arayın.") : loading ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />{english ? "Searching…" : "Aranıyor…"}</> : result?.error ? (english ? "Search could not be completed. Please try again." : "Arama tamamlanamadı. Lütfen yeniden deneyin.") : items.length ? `${items.length}${items.length === 20 ? "+" : ""} ${english ? "results · Newest first" : "sonuç · En yeni önce"}` : (english ? "No news found. Try another word." : "Haber bulunamadı. Başka bir kelime deneyin.")}</p>
        <ul id={listId} role="listbox" aria-label={english ? "Search results" : "Arama sonuçları"}>{items.map((item, index) => <li key={item.id} role="presentation">
          <Link id={`${listId}-${index}`} href={languageHref(`/haber/${item.id}`, language)} role="option" aria-selected={index === active} className="visitor-search-result" onClick={close} onFocus={() => setActive(index)}>
            <span className="min-w-0"><time dateTime={item.date}>{new Intl.DateTimeFormat(english ? "en-US" : "tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(item.date))}</time><strong>{item.title}</strong><span className="visitor-search-excerpt">{item.excerpt}</span></span><ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </li>)}</ul>
      </div>
      <footer className="visitor-search-footer">{english ? "↑ ↓ Navigate · Enter Open · Esc Close" : "↑ ↓ Gezin · Enter Aç · Esc Kapat"}</footer>
    </dialog>
  </>;
}
