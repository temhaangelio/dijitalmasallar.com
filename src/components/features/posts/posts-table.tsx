"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, LoaderCircle, Plus, Trash2 } from "lucide-react";
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
  return <>
    <PostsStatusTabs active={status} total={overallTotal} scheduledTotal={scheduledCount} onChange={value => { if (value !== status) { beginChange(); setStatus(value); } }} />
    <div className="card">
      <PostsToolbar query={query} onQueryChange={value => { if (value !== query) { beginChange(); setQuery(value); } }} language={currentLanguage} onLanguageChange={changeLanguage} pendingLanguage={null} sort={sort} onSortChange={changeSort} />
      <div aria-busy={isSearching}>
        {isSearching && <p role="status" className="mb-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Yazılar güncelleniyor…</p>}
        {posts.length ? <ul aria-label="Yazılar" className={`divide-y divide-line ${isSearching ? "opacity-50" : ""}`}>
          {posts.map(post => <li key={post.id} className="group flex items-start gap-2 py-5 first:pt-2 last:pb-2 sm:gap-4">
            <Link href={`/yazilar/${post.id}/duzenle`} prefetch={false} className="flex min-w-0 flex-1 items-start gap-3 rounded-lg sm:gap-4">
              <div className="relative grid aspect-square w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-3 text-faint sm:aspect-[4/3] sm:w-24">
                {post.cover_path ? isOptimizableImage(post.cover_path)
                  ? <Image src={post.cover_path} alt="" fill sizes="(max-width: 639px) 56px, 96px" className="object-cover" />
                  // eslint-disable-next-line @next/next/no-img-element -- external official source image
                  : <img src={post.cover_path} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                  : <ImageIcon className="size-5" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-muted">
                  <time dateTime={post.created_at} className="tabular-nums">{dateFormatter.format(new Date(post.published_at ?? post.scheduled_at ?? post.created_at))}</time>
                  <span className={`rounded-full px-2 ${post.status === "scheduled" ? "bg-warning-surface text-warning" : "bg-surface-2 text-ink-2"}`}>{post.status === "scheduled" ? "Planlı" : "Yayında"}</span>
                </div>
                <h2 className="line-clamp-2 font-[family-name:var(--font-source-serif)] text-[18px] font-medium leading-snug text-ink sm:text-[20px]">{post.title || post.excerpt || "Başlıksız not"}</h2>
                <p className="mt-2 truncate text-xs text-muted">{sourceLabel(null, post.source_url, "Kaynak yok")}</p>
              </div>
            </Link>
            <button type="button" disabled={isSearching} onClick={() => setPostToDelete(post)} aria-label={`${post.title || "Yazı"} sil`} className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger-surface hover:text-danger disabled:opacity-40"><Trash2 className="size-4" strokeWidth={1.6} aria-hidden="true" /></button>
          </li>)}
        </ul> : !isSearching && <EmptyState title={filtered ? "Eşleşen yazı bulunamadı" : "Henüz yazı yok"} description={filtered ? "Arama veya filtreyi değiştirip tekrar deneyin." : "İlk yazınızı ekleyin; burada listelenecek."} />}
        <div className="mt-5 flex flex-col items-center gap-3 border-t border-line pt-5">
          <p className="text-xs text-muted" aria-live="polite">{posts.length.toLocaleString("tr-TR")} / {resultTotal.toLocaleString("tr-TR")} yazı</p>
          {hasMore && <Button type="button" variant="outline" onClick={loadMore} disabled={isLoadingMore || isSearching}>{isLoadingMore ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{isLoadingMore ? "Yükleniyor…" : "Daha fazla yazı"}</Button>}
          {loadError && <div role="alert" className="text-center"><p className="text-sm text-danger">{loadError}</p><Button type="button" variant="ghost" onClick={reload} disabled={isSearching}>Tekrar dene</Button></div>}
        </div>
      </div>
    </div>
    <ConfirmDialog open={Boolean(postToDelete)} title="Yazı silinsin mi?" description={postToDelete ? `“${postToDelete.title || "Bu yazı"}” ve kapak görseli kalıcı olarak silinecek.` : "Bu işlem geri alınamaz."} confirmLabel="Yazıyı sil" variant="destructive" onOpenChange={open => !open && setPostToDelete(null)} onConfirm={removeSelectedPost} />
  </>;
}
