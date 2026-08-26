"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { deletePostAction, loadMorePostsAction } from "@/app/(dashboard)/yazilar/actions";
import { EmptyState } from "@/components/feedback/states";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { PostsStatusTabs, type PostStatusFilter } from "@/components/features/posts/posts-status-tabs";
import { PostsToolbar } from "@/components/features/posts/posts-toolbar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableWrap, Td } from "@/components/ui/table";
import { showToast } from "@/components/ui/toast";
import type { Post } from "@/types/database";
import type { PostSort } from "@/services/posts";

type PostsTableProps = {
  initialPosts: Post[];
  total: number;
  scheduledTotal: number;
  language: "tr" | "en";
  pageSize?: number;
};

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
  const [isChangingLanguage, startLanguageChange] = useTransition();
  const [isSorting, startSorting] = useTransition();
  const [sort, setSort] = useState<PostSort>("newest");
  const [status, setStatus] = useState<PostStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchRequest = useRef(0);
  const initialCriteria = useRef(true);

  useEffect(() => {
    if (initialCriteria.current) {
      initialCriteria.current = false;
      return;
    }
    const requestId = ++searchRequest.current;
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      const result = await loadMorePostsAction(1, pageSize, currentLanguage, sort, query, status);
      if (requestId !== searchRequest.current) return;
      if (!result.success) {
        setLoadError(result.message);
      } else {
        setPosts(result.posts);
        setResultTotal(result.total);
        setPage(1);
        setLoadError(null);
      }
      setIsSearching(false);
    }, query.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [currentLanguage, pageSize, query, sort, status]);

  const hasMore = posts.length < resultTotal;
  const busy = isChangingLanguage || isSorting || isSearching;
  function changeSort(nextSort: PostSort) {
    if (nextSort === sort || isSorting) return;
    setLoadError(null);
    setIsSearching(true);
    startSorting(() => setSort(nextSort));
  }

  function changeLanguage(nextLanguage: "tr" | "en") {
    if (nextLanguage === currentLanguage || isChangingLanguage) return;
    setLoadError(null);
    setIsSearching(true);
    startLanguageChange(() => { setCurrentLanguage(nextLanguage); setSort("newest"); });
  }

  function loadMore() {
    setLoadError(null);
    startLoadingMore(async () => {
      const result = await loadMorePostsAction(page + 1, pageSize, currentLanguage, sort, query, status);
      if (!result.success) {
        setLoadError(result.message);
        return;
      }
      setPosts((current) => {
        const knownIds = new Set(current.map((post) => post.id));
        return [...current, ...result.posts.filter((post) => !knownIds.has(post.id))];
      });
      setResultTotal(result.total);
      setPage(result.page);
    });
  }

  async function removeSelectedPost() {
    if (!postToDelete) return false;
    const result = await deletePostAction(postToDelete.id);
    showToast(result.message, result.success ? "success" : "error");
    if (!result.success) return false;
    setPosts((current) => current.filter((post) => post.id !== postToDelete.id));
    setResultTotal((current) => Math.max(0, current - 1));
    setOverallTotal((current) => Math.max(0, current - 1));
    if (postToDelete.status === "scheduled") setScheduledCount((current) => Math.max(0, current - 1));
    return true;
  }

  const emptyState = query.trim() || status !== "all"
    ? { title: "Eşleşen yazı bulunamadı", description: "Arama veya filtreyi değiştirip tekrar deneyin." }
    : { title: "Henüz yazı yok", description: "İlk yazınızı ekleyin; burada listelenecek." };

  return (
    <>
      <PostsStatusTabs active={status} total={overallTotal} scheduledTotal={scheduledCount} onChange={(value) => { setIsSearching(true); setStatus(value); }} />

      <div className="card">
        <PostsToolbar
          query={query}
          onQueryChange={(value) => { setIsSearching(true); setQuery(value); }}
          language={currentLanguage}
          onLanguageChange={changeLanguage}
          languagePending={isChangingLanguage}
          sort={sort}
          onSortChange={changeSort}
        />

        <div className="relative" aria-busy={busy}>
          {busy ? (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-field bg-surface/75 backdrop-blur-[1px]" role="status">
              <span className="flex items-center gap-2 text-sm font-semibold text-muted">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Yazılar güncelleniyor…
              </span>
            </div>
          ) : null}

          {posts.length ? (
            <TableWrap>
              <Table>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="transition-colors hover:bg-surface-2">
                      <Td className="align-top">
                        <div className="flex items-start gap-3">
                          <Link href={`/yazilar/${post.id}/duzenle`} className="group min-w-0 flex-1 rounded-sm">
                            <p className="mb-2 text-xs text-muted tabular-nums">
                              {new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(post.published_at ?? post.scheduled_at ?? post.created_at))}
                            </p>
                            <MarkdownPreview value={post.body} compact />
                          </Link>
                          <button type="button" onClick={() => setPostToDelete(post)} aria-label={`${post.title || "Yazı"} sil`} className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger-surface hover:text-danger">
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : <EmptyState title={emptyState.title} description={emptyState.description} />}

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-line pt-5">
            <p className="text-sm text-muted" aria-live="polite">{posts.length.toLocaleString("tr-TR")} / {resultTotal.toLocaleString("tr-TR")} yazı yüklendi</p>
            {hasMore ? (
              <Button type="button" variant="outline" onClick={loadMore} disabled={isLoadingMore} aria-describedby={loadError ? "load-more-error" : undefined}>
                {isLoadingMore ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {isLoadingMore ? "Yükleniyor…" : "Daha fazla yazı yükle"}
              </Button>
            ) : null}
            {loadError ? <p id="load-more-error" role="alert" className="text-sm font-medium text-danger">{loadError}</p> : null}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(postToDelete)}
        title="Yazı silinsin mi?"
        description={postToDelete ? `“${postToDelete.title || "Bu yazı"}” ve kapak görseli kalıcı olarak silinecek.` : "Bu işlem geri alınamaz."}
        confirmLabel="Yazıyı sil"
        variant="destructive"
        onOpenChange={(open) => !open && setPostToDelete(null)}
        onConfirm={removeSelectedPost}
      />
    </>
  );
}
