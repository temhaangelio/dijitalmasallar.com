"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { deletePostAction, loadMorePostsAction } from "@/app/(dashboard)/yazilar/actions";
import { EmptyState } from "@/components/feedback/states";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { PostsStatusTabs, type PostStatusFilter } from "@/components/features/posts/posts-status-tabs";
import { PostsToolbar, columnLabels, type OptionalColumn } from "@/components/features/posts/posts-toolbar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import type { Post, PostStatus } from "@/types/database";
import type { PostSort } from "@/services/posts";

const labels: Record<PostStatus, string> = { published: "Yayında", draft: "Taslak", scheduled: "Planlı", archived: "Arşiv" };
const statusVariants: Record<PostStatus, BadgeProps["variant"]> = { published: "solid", draft: "neutral", scheduled: "outline", archived: "neutral" };
const languageLabels = { tr: "Türkçe", en: "İngilizce" } as const;
const columnsStorageKey = "diji-news-post-columns";
const defaultColumns: Record<OptionalColumn, boolean> = { language: true, category: true, status: true, reads: true, date: true };

type PostsTableProps = {
  initialPosts: Post[];
  total: number;
  scheduledTotal: number;
  language: "tr" | "en";
  pageSize?: number;
};

export function PostsTable({ initialPosts, total, scheduledTotal, language, pageSize = 20 }: PostsTableProps) {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [posts, setPosts] = useState(initialPosts);
  const [resultTotal, setResultTotal] = useState(total);
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
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  // Reading the stored preference during render would mismatch the server markup, so it is applied
  // after mount instead.
  useEffect(() => {
    let saved: Partial<Record<OptionalColumn, boolean>> | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(columnsStorageKey) ?? "null") as Partial<Record<OptionalColumn, boolean>> | null;
    } catch { /* Invalid preferences fall back to all columns. */ }
    if (!saved) return;
    const frame = requestAnimationFrame(() => setVisibleColumns({ ...defaultColumns, ...saved }));
    return () => cancelAnimationFrame(frame);
  }, []);

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
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;
  const tableWidth = visibleColumnCount <= 2 ? "min-w-[560px]" : visibleColumnCount <= 4 ? "min-w-[680px]" : "min-w-[820px]";

  function toggleColumn(column: OptionalColumn) {
    setVisibleColumns((current) => {
      const next = { ...current, [column]: !current[column] };
      try { localStorage.setItem(columnsStorageKey, JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
      return next;
    });
  }

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

  async function deleteSelectedPost() {
    if (!postToDelete) return false;
    const result = await deletePostAction(postToDelete.id);
    if (!result.success) {
      setDeleteError(result.message);
      return false;
    }
    router.refresh();
    return true;
  }

  function setConfirmOpen(open: boolean) {
    if (!open) setPostToDelete(null);
    setDeleteError(null);
  }

  const emptyState = query.trim() || status !== "all"
    ? { title: "Eşleşen yazı bulunamadı", description: "Arama veya filtreyi değiştirip tekrar deneyin." }
    : { title: "Henüz yazı yok", description: "İlk yazınızı ekleyin; burada listelenecek." };

  return (
    <>
      <PostsStatusTabs active={status} total={total} scheduledTotal={scheduledTotal} onChange={(value) => { setIsSearching(true); setStatus(value); }} />

      <div className="card">
        <PostsToolbar
          query={query}
          onQueryChange={(value) => { setIsSearching(true); setQuery(value); }}
          language={currentLanguage}
          onLanguageChange={changeLanguage}
          languagePending={isChangingLanguage}
          sort={sort}
          onSortChange={changeSort}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
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
              <Table className={tableWidth}>
                <thead>
                  <tr>
                    <Th className="w-full">Yazı</Th>
                    {visibleColumns.language && <Th className="w-px whitespace-nowrap">{columnLabels.language}</Th>}
                    {visibleColumns.category && <Th className="w-px whitespace-nowrap">{columnLabels.category}</Th>}
                    {visibleColumns.status && <Th className="w-px whitespace-nowrap">{columnLabels.status}</Th>}
                    {visibleColumns.reads && <Th className="w-px whitespace-nowrap text-right">{columnLabels.reads}</Th>}
                    {visibleColumns.date && <Th className="w-px whitespace-nowrap text-right">{columnLabels.date}</Th>}
                    <Th className="w-px"><span className="sr-only">İşlemler</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="transition-colors hover:bg-surface-2">
                      <Td className="align-top">
                        <Link href={`/yazilar/${post.id}/duzenle`} className="group block rounded-sm">
                          <MarkdownPreview value={post.body} compact />
                        </Link>
                      </Td>
                      {visibleColumns.language && <Td className="w-px whitespace-nowrap"><Badge><abbr title={languageLabels[post.language === "en" ? "en" : "tr"]} className="no-underline">{post.language === "en" ? "EN" : "TR"}</abbr></Badge></Td>}
                      {visibleColumns.category && <Td className="w-px whitespace-nowrap">{post.category || "—"}</Td>}
                      {visibleColumns.status && <Td className="w-px whitespace-nowrap"><Badge variant={statusVariants[post.status]}>{labels[post.status]}</Badge></Td>}
                      {visibleColumns.reads && <Td className="w-px whitespace-nowrap text-right font-semibold tabular-nums">{post.reads ? post.reads.toLocaleString("tr-TR") : "—"}</Td>}
                      {visibleColumns.date && <Td className="w-px whitespace-nowrap text-right text-muted tabular-nums">{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(post.published_at ?? post.scheduled_at ?? post.created_at))}</Td>}
                      <Td className="w-px">
                        <div className="flex justify-end">
                          <ActionMenu
                            label="Yazı işlemleri"
                            items={[
                              { label: "Düzenle", href: `/yazilar/${post.id}/duzenle`, icon: <Pencil size={15} aria-hidden="true" /> },
                              { label: "Sil", destructive: true, icon: <Trash2 size={15} aria-hidden="true" />, onSelect: () => { setDeleteError(null); setPostToDelete(post); } },
                            ]}
                          />
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
        description="Bu yazı kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Yazıyı sil"
        variant="destructive"
        error={deleteError}
        onOpenChange={setConfirmOpen}
        onConfirm={deleteSelectedPost}
      />
    </>
  );
}
