"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUpRight, CheckCheck, Circle, CircleCheck, FileText, RefreshCw, Trash2 } from "lucide-react";
import { markAllReadAction, refreshFeedsAction, removeReadItemsAction, toggleItemReadAction } from "@/app/(dashboard)/rss/actions";
import { EmptyState } from "@/components/feedback/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import type { RssItem } from "@/services/rss";

const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

/**
 * Long enough that holding the arrow key to travel does not mark every row on the way past, short
 * enough that stopping on a headline marks it before you have finished reading it.
 */
const markReadDelayMs = 300;
const itemPageSize = 20;

export function RssItemsList({
  items,
  activeFeedId,
  unreadOnly,
  hasFeeds,
}: {
  items: RssItem[];
  activeFeedId?: string;
  unreadOnly: boolean;
  hasFeeds: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removeReadOpen, setRemoveReadOpen] = useState(false);

  /*
   * Read state is held on the client rather than re-read from the server after every change, and
   * that is the whole trick behind landing on a row marking it read.
   *
   * In the unread view the server stops returning a row the moment it is read, so refreshing after
   * an auto-mark would delete the row under the cursor and shift everything below it — while you
   * are still arrowing through. Keeping the change client-side lets the row stay where it is,
   * dimmed, until you deliberately refresh or navigate.
   *
   * The overrides only ever mirror a write that succeeded, so they cannot drift from the server; a
   * failed write puts the row back and says so.
   */
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(itemPageSize);
  const shownItems = items.map((item) => (item.id in readOverrides ? { ...item, read: readOverrides[item.id] } : item));
  const visibleItems = shownItems.slice(0, visibleCount);

  function setRead(item: RssItem, read: boolean) {
    setReadOverrides((current) => ({ ...current, [item.id]: read }));
    void toggleItemReadAction(item.id, read).then((result) => {
      if (result.success) return;
      setReadOverrides((current) => ({ ...current, [item.id]: !read }));
      showToast(result.message, "error");
    });
  }

  /** Refresh and mark-all go through the server, so the local overrides stop being the truth. */
  function runServerAction(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      showToast(result.message, result.success ? "success" : "error");
      setReadOverrides({});
      router.refresh();
    });
  }

  async function removeRead() {
    const result = await removeReadItemsAction(activeFeedId);
    showToast(result.message, result.success ? "success" : "error");
    if (!result.success) return false;
    setReadOverrides({});
    router.refresh();
    return true;
  }

  /*
   * Keyboard navigation, scoped to the list rather than the window.
   *
   * A document-level listener would have to guess whether the person is typing — in the add-feed
   * URL field, say — and guessing wrong swallows their keystrokes. Handling the event on the list
   * means the shortcuts only exist while focus is actually inside it, which is also when they are
   * wanted.
   *
   * The titles carry a roving tabindex: one Tab reaches the list, arrows move within it, so a long
   * list costs one tab stop instead of one per row. The position is remembered by item id rather
   * than index, so tabbing away and back returns to the headline you were on.
   */
  const listRef = useRef<HTMLUListElement>(null);
  const markTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // Falls back to the first row, which is what makes the list reachable by Tab in the first place.
  const activeId = focusedId && visibleItems.some((item) => item.id === focusedId) ? focusedId : visibleItems[0]?.id;
  const selectedItem = visibleItems.find((item) => item.id === activeId);

  useEffect(() => () => { if (markTimer.current) clearTimeout(markTimer.current); }, []);

  function onRowFocus(item: RssItem) {
    setFocusedId(item.id);
    if (markTimer.current) clearTimeout(markTimer.current);
    if (item.read) return;
    markTimer.current = setTimeout(() => setRead(item, true), markReadDelayMs);
  }

  function focusRow(index: number) {
    const titles = listRef.current?.querySelectorAll<HTMLElement>("[data-rss-title]");
    if (!titles?.length) return;
    const target = titles[Math.min(Math.max(index, 0), titles.length - 1)];
    target?.focus();
    target?.scrollIntoView({ block: "nearest" });
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const titles = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-rss-title]") ?? [])];
    const current = titles.findIndex((title) => title === document.activeElement || title.contains(document.activeElement));
    if (current === -1) return;

    const move = (to: number) => { event.preventDefault(); focusRow(to); };
    if (event.key === "ArrowDown" || event.key === "j") return move(current + 1);
    if (event.key === "ArrowUp" || event.key === "k") return move(current - 1);
    if (event.key === "Home") return move(0);
    if (event.key === "End") return move(titles.length - 1);

    if (event.key === "m") {
      event.preventDefault();
      // The manual toggle has to beat the pending auto-mark, or marking something unread would be
      // undone a moment later by the timer that focusing it started.
      if (markTimer.current) clearTimeout(markTimer.current);
      const item = visibleItems[current];
      if (item) setRead(item, !item.read);
    }
  }

  const filterHref = (unread: boolean) => {
    const params = new URLSearchParams();
    if (activeFeedId) params.set("feed", activeFeedId);
    if (!unread) params.set("filter", "all");
    const query = params.toString();
    return query ? `/rss?${query}` : "/rss";
  };

  const titleClass = (read: boolean) =>
    `min-w-0 flex-1 truncate text-[17px] leading-[1.45] tracking-[-.015em] ${read ? "font-medium text-muted" : "font-semibold text-ink"}`;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)] xl:h-full xl:min-h-0 xl:items-stretch">
      <div className="card xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label="İçerik filtresi" className="flex gap-1 rounded-full bg-surface-2 p-1">
            {[{ label: "Okunmamış", unread: true }, { label: "Tümü", unread: false }].map((tab) => {
              const selected = tab.unread === unreadOnly;
              return (
                <Link
                  key={tab.label}
                  href={filterHref(tab.unread)}
                  role="tab"
                  aria-selected={selected}
                  className={`flex h-9 items-center rounded-full px-4 text-[13px] font-semibold transition-colors ${selected ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={pending || !hasFeeds} onClick={() => setRemoveReadOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" />Okunmuşları sil
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={pending || !hasFeeds} onClick={() => runServerAction(() => markAllReadAction(activeFeedId))}>
              <CheckCheck className="size-4" aria-hidden="true" />Tümünü okundu işaretle
            </Button>
            <Button type="button" size="sm" disabled={pending || !hasFeeds} onClick={() => runServerAction(() => refreshFeedsAction(activeFeedId))}>
              <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />Yenile
            </Button>
          </div>
        </div>

        {shownItems.length ? (
          <>
            <p className="mt-4 hidden flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-faint sm:flex">
              <span><kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> gez</span>
              <span aria-hidden="true">·</span>
              <span><kbd className="font-sans">m</kbd> okundu/okunmadı</span>
              <span aria-hidden="true">·</span>
              <span>üstüne geldiğin başlık okundu sayılır</span>
            </p>

            <ul id="rss-items" ref={listRef} onKeyDown={onListKeyDown} className="mt-2 divide-y divide-line xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              {visibleItems.map((item) => (
                <li
                  key={item.id}
                  className={`group relative -mx-2 flex items-center gap-3.5 rounded-xl px-2 py-3 transition-colors focus-within:bg-surface-2 ${item.read ? "opacity-55" : ""}`}
                >
                  {/* The cursor. `focus-within` rather than `focus-visible`: clicking a headline and
                      then arrowing on is a normal way to start, and `focus-visible` paints nothing
                      after a mouse click — which would leave you arrowing blind. */}
                  <span aria-hidden="true" className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-ink group-focus-within:block" />

                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setRead(item, !item.read)}
                    aria-label={item.read ? `“${item.title}” okunmadı işaretle` : `“${item.title}” okundu işaretle`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-surface-3 hover:text-ink"
                  >
                    {item.read ? <CircleCheck className="size-[18px]" aria-hidden="true" /> : <Circle className="size-[18px]" aria-hidden="true" />}
                  </button>

                  {item.link ? (
                    <button
                      type="button"
                      data-rss-title
                      tabIndex={item.id === activeId ? 0 : -1}
                      onFocus={() => onRowFocus(item)}
                      className={`${titleClass(item.read)} text-left`}
                    >
                      {item.title}
                    </button>
                  ) : (
                    <span data-rss-title tabIndex={item.id === activeId ? 0 : -1} onFocus={() => onRowFocus(item)} className={titleClass(item.read)}>
                      {item.title}
                    </span>
                  )}

                  {/* With a click no longer opening the source, the mouse needs a way in of its own. */}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                      aria-label={`“${item.title}” kaynağını yeni sekmede aç`}
                      title="Kaynağı yeni sekmede aç"
                      className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-0 transition-opacity hover:bg-surface-3 hover:text-ink group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                      <ArrowUpRight className="size-[18px]" aria-hidden="true" />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {visibleItems.length < shownItems.length && (
              <button
                type="button"
                aria-controls="rss-items"
                onClick={() => setVisibleCount((count) => Math.min(count + itemPageSize, shownItems.length))}
                className="group mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-surface-2 px-5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Daha fazla yükle
                <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              </button>
            )}
          </>
        ) : (
          <div className="mt-5">
            <EmptyState
              title={hasFeeds ? (unreadOnly ? "Okunmamış içerik yok" : "Bu kaynakta içerik yok") : "Henüz kaynak eklenmedi"}
              description={hasFeeds ? "Yeni içerik için “Yenile” deyin." : "“Kaynak ekle” ile bir RSS adresi ekleyerek takibe başlayın."}
            />
          </div>
        )}
      </div>

      {selectedItem ? (
        <aside className="card lg:sticky lg:top-4 xl:h-full xl:overflow-y-auto" aria-labelledby="rss-item-summary-title">
          <h2 id="rss-item-summary-title" className="text-[24px] font-bold leading-[1.25] tracking-[-.035em] text-ink">
            {selectedItem.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-faint">
            <span>{selectedItem.feedTitle}</span>
            {selectedItem.publishedAt && <span aria-hidden="true">·</span>}
            {selectedItem.publishedAt && <time dateTime={selectedItem.publishedAt}>{dateFormat.format(new Date(selectedItem.publishedAt))}</time>}
          </div>

          <p className={`mt-6 whitespace-pre-line text-[16px] leading-7 ${selectedItem.summary ? "text-ink-2" : "italic text-muted"}`}>
            {selectedItem.summary || "Bu haber için kaynak tarafından bir açıklama sağlanmadı."}
          </p>

          {selectedItem.link && (
            <a
              href={selectedItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
            >
              Haberi kaynağında aç <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          )}
        </aside>
      ) : (
        <aside className="card grid min-h-56 place-items-center border-dashed lg:sticky lg:top-4 xl:h-full" aria-label="Haber önizlemesi">
          <div className="max-w-xs text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-[17px] font-semibold text-ink">Haber önizlemesi</h2>
            <p className="mt-1.5 text-[13px] leading-5 text-muted">Listeden bir haber seçtiğinizde içeriği burada görüntülenir.</p>
          </div>
        </aside>
      )}
      <ConfirmDialog
        open={removeReadOpen}
        onOpenChange={setRemoveReadOpen}
        title="Okunmuş içerikler silinsin mi?"
        description={activeFeedId ? "Bu kaynaktaki okunmuş içerikler kalıcı olarak silinecek. Okunmamış içerikler ve kaynak korunacak." : "Tüm kaynaklardaki okunmuş içerikler kalıcı olarak silinecek. Okunmamış içerikler ve kaynaklar korunacak."}
        confirmLabel="Okunmuşları sil"
        variant="destructive"
        onConfirm={removeRead}
      />
    </div>
  );
}
