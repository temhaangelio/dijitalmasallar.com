"use client";

import { useEffect, useState } from "react";
import { loadCoverLibraryAction } from "@/app/(dashboard)/yazilar/actions";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";

type CoverItem = { id: string; url: string; title: string };

export function CoverLibrary({ onClose, onSelect }: { onClose: () => void; onSelect: (item: CoverItem) => void }) {
  const [items, setItems] = useState<CoverItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
    loadCoverLibraryAction(page, search).then(result => {
      if (!active) return;
      if (!result.success) { setError(result.message); return; }
      setItems(current => {
        const previous = page === 1 ? [] : current;
        const urls = new Set(previous.map(item => item.url));
        return [...previous, ...result.items.filter(item => { if (urls.has(item.url)) return false; urls.add(item.url); return true; })];
      });
      setHasMore(result.hasMore);
    }).catch(() => { if (active) setError("Görseller yüklenemedi. Tekrar deneyin."); })
      .finally(() => { if (active) setLoading(false); });
    }, search.trim() ? 300 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [page, retry, search]);

  return <AppDialog title="Görsel kütüphanesi" hideIdentity headline="Görsel kütüphanesi" onClose={onClose} panelClassName="!max-w-[800px]">
    <p className="mb-5 text-sm text-muted">Yazılarınızda kullandığınız kapaklardan birini seçin.</p>
    <div className="relative mb-5">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <Input type="search" aria-label="Görsel kütüphanesinde ara" placeholder="Haber içeriğine göre ara…" value={search} maxLength={120} className="pl-10" onChange={event => {
        setSearch(event.target.value); setPage(1); setItems([]); setHasMore(false); setError(""); setLoading(true);
      }} />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy={loading}>
      {items.map(item => <button key={item.id} type="button" onClick={() => onSelect(item)} aria-label={`${item.title} görselini seç`} className="group overflow-hidden rounded-xl border border-line bg-surface text-left hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- library includes images hosted by external news sources */}
        <img src={item.url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
        <span className="block truncate px-3 py-2 text-xs font-medium">{item.title}</span>
      </button>)}
    </div>
    {loading ? <p role="status" className="py-6 text-center text-sm text-muted">Görseller yükleniyor…</p> : null}
    {!loading && !error && !items.length ? <p className="py-8 text-center text-sm text-muted">{search.trim() ? "Aramanızla eşleşen görsel bulunamadı." : "Henüz kayıtlı kapak görseli yok."}</p> : null}
    {error ? <div role="alert" className="mt-4 text-center"><p className="text-sm text-danger">{error}</p><Button type="button" variant="ghost" onClick={() => { setError(""); setLoading(true); setRetry(value => value + 1); }}>Tekrar dene</Button></div> : null}
    {hasMore && !error ? <Button type="button" variant="outline" disabled={loading} className="mt-5 w-full" onClick={() => { setLoading(true); setPage(value => value + 1); }}>Daha fazla görsel</Button> : null}
  </AppDialog>;
}
