"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ImageIcon, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { deletePostAction, loadMorePostsAction } from "@/app/(dashboard)/yazilar/actions";
import { EmptyState } from "@/components/feedback/states";
import { PostsStatusTabs, type PostStatusFilter } from "./posts-status-tabs";
import { PostsToolbar } from "./posts-toolbar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import { isOptimizableImage } from "@/lib/images";
import { sourceLabel } from "@/lib/source-label";
import type { Post } from "@/types/database";
import type { PostSort } from "@/services/posts";
import styles from "./posts-table.module.css";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

type PostsTableProps = { initialPosts: Post[]; total: number; scheduledTotal: number; language: "tr" | "en"; pageSize?: number };

export function PostsTable({ initialPosts, total, scheduledTotal, language, pageSize = 20 }: PostsTableProps) {
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [posts, setPosts] = useState(initialPosts);
  const [overallTotal, setOverallTotal] = useState(total);
  const [scheduledCount, setScheduledCount] = useState(scheduledTotal);
  const [resultTotal, setResultTotal] = useState(total);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const [sort, setSort] = useState<PostSort>("newest");
  const [status, setStatus] = useState<PostStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [revision, setRevision] = useState(0);
  const requestVersion = useRef(0);
  const initialCriteria = useRef(true);

  useEffect(() => {
    if (initialCriteria.current) { initialCriteria.current = false; return; }
    const request = ++requestVersion.current;
    const timer = window.setTimeout(async () => {
      try {
        const result = await loadMorePostsAction(1, pageSize, currentLanguage, sort, query, status);
        if (request !== requestVersion.current) return;
        if (!result.success) setLoadError(result.message);
        else { setPosts(result.posts); setResultTotal(result.total); setPage(result.page); setLoadError(null); }
      } catch {
        if (request === requestVersion.current) setLoadError("Yazılar yüklenemedi. Lütfen tekrar deneyin.");
      } finally {
        if (request === requestVersion.current) setIsSearching(false);
      }
    }, query.trim() ? 300 : 0);
    return () => { window.clearTimeout(timer); requestVersion.current = request + 1; };
  }, [currentLanguage, pageSize, query, sort, status, revision]);

  function beginChange() { requestVersion.current++; setLoadError(null); setIsSearching(true); }
  function changeSort(value: PostSort) { if (value !== sort) { beginChange(); setSort(value); } }
  function changeLanguage(value: "tr" | "en") { if (value !== currentLanguage) { beginChange(); setCurrentLanguage(value); setSort("newest"); } }
  function reload() { beginChange(); setRevision(value => value + 1); }

  function loadMore() {
    if (isSearching || isLoadingMore) return;
    const request = requestVersion.current;
    setLoadError(null);
    startLoadingMore(async () => {
      try {
        const result = await loadMorePostsAction(page + 1, pageSize, currentLanguage, sort, query, status);
        if (request !== requestVersion.current) return;
        if (!result.success) { setLoadError(result.message); return; }
        setPosts(current => {
          const known = new Set(current.map(post => post.id));
          return [...current, ...result.posts.filter(post => !known.has(post.id))];
        });
        setResultTotal(result.total); setPage(result.page);
      } catch {
        if (request === requestVersion.current) setLoadError("Yazılar yüklenemedi. Lütfen tekrar deneyin.");
      }
    });
  }

  async function removeSelectedPost() {
    if (!postToDelete) return false;
    try {
      const result = await deletePostAction(postToDelete.id);
      showToast(result.message, result.success ? "success" : "error");
      if (!result.success) return false;
      setPosts(current => current.filter(post => post.id !== postToDelete.id));
      setOverallTotal(current => Math.max(0, current - 1));
      if (postToDelete.status === "scheduled") setScheduledCount(current => Math.max(0, current - 1));
      // Deleting shifts database offsets: reload page one instead of silently skipping the next row.
      reload();
      return true;
    } catch { showToast("Yazı silinemedi. Lütfen tekrar deneyin.", "error"); return false; }
  }

  const hasMore = posts.length < resultTotal;
  const filtered = query.trim() || status !== "all";
  const progress = resultTotal > 0 ? Math.min(100, (posts.length / resultTotal) * 100) : 100;
  return <>
    <section className="card overflow-hidden !p-0" aria-label="Haber yönetimi">
      <div className="space-y-4 border-b border-line bg-surface px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <PostsStatusTabs active={status} total={overallTotal} scheduledTotal={scheduledCount} onChange={value => { if (value !== status) { beginChange(); setStatus(value); } }} />
          <p className="hidden shrink-0 text-sm font-medium text-muted sm:block" aria-live="polite">{resultTotal.toLocaleString("tr-TR")} sonuç</p>
        </div>
        <PostsToolbar query={query} onQueryChange={value => { if (value !== query) { beginChange(); setQuery(value); } }} language={currentLanguage} onLanguageChange={changeLanguage} pendingLanguage={null} sort={sort} onSortChange={changeSort} />
      </div>
      <div aria-busy={isSearching} className="relative">
        {isSearching && <p role="status" className="flex min-h-12 items-center gap-2 border-b border-line bg-surface-2 px-4 text-sm font-medium text-muted sm:px-5"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Liste güncelleniyor…</p>}
        {posts.length ? <ul aria-label="Yazılar" className={`${isSearching ? "pointer-events-none opacity-50" : ""}`}>
          {posts.map(post => <li key={post.id} className={`${styles.row} group flex min-h-[104px] items-center gap-2 border-b border-line px-3 py-3 transition-colors last:border-b-0 hover:bg-surface-2/60 sm:gap-3 sm:px-5 sm:py-4`}>
            <Link href={`/yazilar/${post.id}/duzenle`} prefetch={false} aria-label={`${post.title || "Başlıksız not"} yazısını düzenle`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 sm:gap-4">
              <div className="relative grid aspect-[4/3] w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface-3 text-faint sm:w-28">
                {post.cover_path ? isOptimizableImage(post.cover_path)
                  ? <Image src={post.cover_path} alt="" fill sizes="(max-width: 639px) 80px, 112px" className="object-cover transition-transform duration-200 group-hover:scale-[1.025] motion-reduce:transition-none" />
                  // eslint-disable-next-line @next/next/no-img-element -- external official source image
                  : <img src={post.cover_path} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                  : <ImageIcon className="size-4" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1 xl:max-w-[95ch]">
                <div className="mb-1.5 flex min-w-0 items-center gap-2 text-[11px] leading-5 text-muted">
                  <time dateTime={post.created_at} className="tabular-nums">{dateFormatter.format(new Date(post.published_at ?? post.scheduled_at ?? post.created_at))}</time>
                  {/* Published is what almost every row is; saying so on all of them said nothing.
                      Only the exception — a post still waiting for its date — gets a label. */}
                  {post.status === "scheduled" && <span className="rounded-md bg-warning-surface px-2 py-0.5 font-semibold text-warning">Planlı</span>}
                  {/* A source is worth naming; the absence of one is not worth a line of its own. */}
                  {post.source_url && <><span aria-hidden="true">·</span><span className="min-w-0 truncate">{sourceLabel(null, post.source_url, "")}</span></>}
                </div>
                <h2 className="line-clamp-2 font-[family-name:var(--font-visitor-sans)] text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink sm:text-[18px]">{post.title || post.excerpt || "Başlıksız not"}</h2>
                {post.excerpt && post.excerpt !== post.title ? <p className="mt-1 hidden line-clamp-1 text-sm text-muted md:block">{post.excerpt}</p> : null}
              </div>
              <ChevronRight className="hidden size-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block" strokeWidth={1.7} aria-hidden="true" />
            </Link>
            <button type="button" disabled={isSearching} onClick={() => setPostToDelete(post)} aria-label={`${post.title || "Yazı"} sil`} title="Yazıyı sil" className={`${styles.rowAction} grid size-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-danger-surface hover:text-danger focus-visible:bg-danger-surface focus-visible:text-danger disabled:opacity-40`}><Trash2 className="size-[18px]" strokeWidth={1.7} aria-hidden="true" /></button>
          </li>)}
        </ul> : !isSearching && <EmptyState title={filtered ? "Eşleşen yazı bulunamadı" : "Henüz yazı yok"} description={filtered ? "Arama veya filtreyi değiştirip tekrar deneyin." : "İlk yazınızı ekleyin; burada listelenecek."} />}
        <div className="flex flex-col items-center gap-3 border-t border-line bg-surface-2/40 px-4 py-5 sm:px-5">
          <div className="flex w-full max-w-sm items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} /></div>
            <p className="shrink-0 text-xs font-medium tabular-nums text-muted" aria-live="polite">{posts.length.toLocaleString("tr-TR")} / {resultTotal.toLocaleString("tr-TR")}</p>
          </div>
          {hasMore && <Button type="button" variant="outline" onClick={loadMore} disabled={isLoadingMore || isSearching}>{isLoadingMore ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{isLoadingMore ? "Yükleniyor…" : "Daha fazla yazı"}</Button>}
          {loadError && <div role="alert" className="text-center"><p className="text-sm text-danger">{loadError}</p><Button type="button" variant="ghost" onClick={reload} disabled={isSearching}>Tekrar dene</Button></div>}
        </div>
      </div>
    </section>
    <ConfirmDialog open={Boolean(postToDelete)} title="Yazı silinsin mi?" description={postToDelete ? `“${postToDelete.title || "Bu yazı"}” ve kapak görseli kalıcı olarak silinecek.` : "Bu işlem geri alınamaz."} confirmLabel="Yazıyı sil" variant="destructive" onOpenChange={open => !open && setPostToDelete(null)} onConfirm={removeSelectedPost} />
  </>;
}
