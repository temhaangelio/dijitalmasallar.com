"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Columns3, ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deletePostAction, loadMorePostsAction } from "@/app/(dashboard)/yazilar/actions";
import { EmptyState } from "@/components/feedback/states";
import { PageLoading } from "@/components/feedback/page-loading";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import type { Post, PostStatus } from "@/types/database";
import type { PostSort } from "@/services/posts";

const labels: Record<PostStatus, string> = { published: "Yayında", draft: "Taslak", scheduled: "Planlı", archived: "Arşiv" };
const tabs: [string, PostStatus | "all"][] = [["Tümü", "all"], ["Yayında", "published"], ["Taslak", "draft"], ["Planlı", "scheduled"]];
const columnLabels = { language: "Dil", category: "Kategori", status: "Durum", reads: "Okuma", date: "Tarih" } as const;
type OptionalColumn = keyof typeof columnLabels;
const defaultColumns: Record<OptionalColumn, boolean> = { language: true, category: true, status: true, reads: true, date: true };
const sortLabels: Record<PostSort, string> = { newest: "En yeni", oldest: "En eski", "title-asc": "Başlık A–Z", "title-desc": "Başlık Z–A", "category-asc": "Kategori A–Z" };

type InitialLanguageData = Record<"tr" | "en", { posts: Post[]; total: number }>;

export function PostsTable({ initialPosts, total, language, initialLanguageData, pageSize = 20 }: { initialPosts: Post[]; total: number; language: "tr" | "en"; initialLanguageData: InitialLanguageData; pageSize?: number }) {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [posts, setPosts] = useState(initialPosts);
  const [totalCount, setTotalCount] = useState(total);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const [isChangingLanguage, startLanguageChange] = useTransition();
  const [isSorting, startSorting] = useTransition();
  const [sort, setSort] = useState<PostSort>("newest");
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  useEffect(() => {
    let saved: Partial<Record<OptionalColumn, boolean>> | null = null;
    try {
      saved = JSON.parse(localStorage.getItem("diji-news-post-columns") ?? "null") as Partial<Record<OptionalColumn, boolean>> | null;
    } catch { /* Invalid preferences fall back to all columns. */ }
    if (!saved) return;
    const frame = requestAnimationFrame(() => setVisibleColumns({ ...defaultColumns, ...saved }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const filtered = useMemo(
    () => posts.filter((post) => (status === "all" || post.status === status) && `${post.title} ${post.excerpt} ${post.body} ${post.category}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))),
    [posts, status, query],
  );
  const hasMore = posts.length < totalCount;

  function toggleColumn(column: OptionalColumn) {
    setVisibleColumns((current) => {
      const next = { ...current, [column]: !current[column] };
      localStorage.setItem("diji-news-post-columns", JSON.stringify(next));
      return next;
    });
  }

  function changeSort(nextSort: PostSort) {
    if (nextSort === sort || isSorting) return;
    setLoadError(null);
    startSorting(async () => {
      const result = await loadMorePostsAction(1, pageSize, currentLanguage, nextSort);
      if (!result.success) { setLoadError(result.message); return; }
      setPosts(result.posts);
      setTotalCount(result.total);
      setPage(1);
      setSort(nextSort);
    });
  }

  function changeLanguage(nextLanguage: "tr" | "en") {
    if (nextLanguage === currentLanguage || isChangingLanguage) return;
    setLoadError(null);
    startLanguageChange(() => {
      const nextData = initialLanguageData[nextLanguage];
      setPosts(nextData.posts);
      setTotalCount(nextData.total);
      setPage(1);
      setCurrentLanguage(nextLanguage);
      setSort("newest");
    });
  }

  function loadMore() {
    setLoadError(null);
    startLoadingMore(async () => {
      const result = await loadMorePostsAction(page + 1, pageSize, currentLanguage, sort);
      if (!result.success) {
        setLoadError(result.message);
        return;
      }
      setPosts((current) => {
        const knownIds = new Set(current.map((post) => post.id));
        return [...current, ...result.posts.filter((post) => !knownIds.has(post.id))];
      });
      setTotalCount(result.total);
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

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {tabs.map(([label, value]) => (
          <button key={value} onClick={() => setStatus(value)} className={`flex h-[132px] flex-col justify-between rounded-[28px] p-6 text-left transition ${status === value ? "bg-black text-white" : "bg-white hover:-translate-y-0.5"}`}>
            <span className={`text-[15px] font-semibold ${status === value ? "text-white" : "text-[#4a4a4a]"}`}>{label}</span>
            <span className="text-[44px] font-bold leading-none tracking-[-.05em]">{value === "all" ? totalCount : posts.filter((post) => post.status === value).length}</span>
          </button>
        ))}
      </div>
      <div className="card">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#a1a1a1]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık veya etikette ara" className="pl-11" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-[#f1f1f1] p-1" aria-label="Yazı dili">
              <button type="button" disabled={isChangingLanguage} onClick={() => changeLanguage("tr")} aria-current={currentLanguage === "tr" ? "page" : undefined} className={`flex h-10 items-center rounded-full px-4 text-sm font-semibold transition disabled:cursor-wait ${currentLanguage === "tr" ? "bg-black text-white" : "text-[#666] hover:text-black"}`}>Türkçe</button>
              <button type="button" disabled={isChangingLanguage} onClick={() => changeLanguage("en")} aria-current={currentLanguage === "en" ? "page" : undefined} className={`flex h-10 items-center rounded-full px-4 text-sm font-semibold transition disabled:cursor-wait ${currentLanguage === "en" ? "bg-black text-white" : "text-[#666] hover:text-black"}`}>İngilizce</button>
            </div>
            <ActionMenu
              label="Sütunları seç"
              placement="center"
              trigger={<><Columns3 size={15} /><span>Sütunlar</span></>}
              triggerClassName="flex h-10 w-auto items-center gap-2 rounded-full bg-[#f1f1f1] px-4 text-sm font-semibold text-black hover:bg-[#e8e8e8]"
              items={(Object.keys(columnLabels) as OptionalColumn[]).map((column) => ({ label: columnLabels[column], checked: visibleColumns[column], keepOpen: true, onSelect: () => toggleColumn(column) }))}
            />
            <ActionMenu
              label="Yazıları sırala"
              trigger={<><ArrowDownUp size={15} /><span>Sırala · {sortLabels[sort]}</span></>}
              triggerClassName="flex h-10 w-auto items-center gap-2 rounded-full bg-[#f1f1f1] px-4 text-sm font-semibold text-black hover:bg-[#e8e8e8]"
              items={(Object.keys(sortLabels) as PostSort[]).map((value) => ({ label: sortLabels[value], checked: sort === value, onSelect: () => changeSort(value) }))}
            />
          </div>
        </div>
        <div className="relative">
        {(isChangingLanguage || isSorting) ? (
          <div className="fixed inset-0 z-[200] overflow-auto bg-[#efefef]">
            <PageLoading variant="admin" label="Panel hazırlanıyor" />
          </div>
        ) : null}
        {filtered.length ? (
          <TableWrap>
            <Table>
              <thead><tr><Th className="w-[48%]">Yazı</Th>{visibleColumns.language && <Th>Dil</Th>}{visibleColumns.category && <Th>Kategori</Th>}{visibleColumns.status && <Th>Durum</Th>}{visibleColumns.reads && <Th className="text-right">Okuma</Th>}{visibleColumns.date && <Th className="text-right">Tarih</Th>}<Th><span className="sr-only">İşlemler</span></Th></tr></thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} className="group hover:bg-[#f7f7f7]">
                    <Td className="align-top"><Link href={`/yazilar/${post.id}/duzenle`} className="block text-base font-bold tracking-[-.022em] hover:underline">{post.title}</Link><div className="mt-3"><MarkdownPreview value={post.body} compact /></div></Td>
                    {visibleColumns.language && <Td><Badge>{post.language === "en" ? "EN" : "TR"}</Badge></Td>}
                    {visibleColumns.category && <Td>{post.category}</Td>}
                    {visibleColumns.status && <Td><Badge className={post.status === "published" ? "bg-black text-white" : post.status === "scheduled" ? "border border-[#dedede] bg-white text-black" : ""}>{labels[post.status]}</Badge></Td>}
                    {visibleColumns.reads && <Td className="text-right font-semibold">{post.reads ? post.reads.toLocaleString("tr-TR") : "—"}</Td>}
                    {visibleColumns.date && <Td className="text-right text-[#a1a1a1]">{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(post.published_at ?? post.scheduled_at ?? post.created_at))}</Td>}
                    <Td>
                      <div className="flex justify-end">
                        <ActionMenu
                          label={`${post.title} işlemleri`}
                          items={[
                            { label: "Düzenle", href: `/yazilar/${post.id}/duzenle`, icon: <Pencil size={15} /> },
                            { label: "Görsel üret", href: `/yazilar/${post.id}/gorsel-uret`, icon: <ImagePlus size={15} /> },
                            { label: "Sil", destructive: true, icon: <Trash2 size={15} />, onSelect: () => { setDeleteError(null); setPostToDelete(post); } },
                          ]}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : <EmptyState title="Eşleşen yazı bulunamadı" description="Arama veya filtreyi değiştirip tekrar deneyin." />}

        <div className="mt-5 flex flex-col items-center gap-3 border-t border-[#ededed] pt-5">
          <p className="text-sm text-[#767676]">{posts.length.toLocaleString("tr-TR")} / {totalCount.toLocaleString("tr-TR")} yazı gösteriliyor</p>
          {hasMore ? (
            <Button type="button" variant="outline" onClick={loadMore} disabled={isLoadingMore} aria-describedby={loadError ? "load-more-error" : undefined}>
              {isLoadingMore ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 size-4" aria-hidden="true" />}
              {isLoadingMore ? "Yükleniyor…" : "Daha fazla yazı yükle"}
            </Button>
          ) : null}
          {loadError ? <p id="load-more-error" role="alert" className="text-sm font-medium text-[#b42318]">{loadError}</p> : null}
        </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(postToDelete)}
        title="Yazı silinsin mi?"
        description={postToDelete ? `“${postToDelete.title}” kalıcı olarak silinecek. Bu işlem geri alınamaz.` : "Bu işlem geri alınamaz."}
        confirmLabel="Yazıyı sil"
        variant="destructive"
        error={deleteError}
        onOpenChange={setConfirmOpen}
        onConfirm={deleteSelectedPost}
      />
    </>
  );
}
