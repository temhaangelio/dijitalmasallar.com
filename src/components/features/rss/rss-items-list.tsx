"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowDown, ArrowUpRight, CheckCheck, Circle, CircleCheck, RefreshCw } from "lucide-react";
import { markAllReadAction, refreshFeedsAction, toggleItemReadAction } from "@/app/(dashboard)/rss/actions";
import { EmptyState } from "@/components/feedback/states";
import { RssDialog } from "@/components/features/rss/rss-dialog";
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
  const [sourceItem, setSourceItem] = useState<RssItem | null>(null);
  const sourceExternalRef = useRef<HTMLAnchorElement>(null);
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

  /**
   * A plain left click selects the headline instead of leaving the page — clicking is how you put
   * the cursor somewhere before arrowing on from it, and opening the source on the way defeats that.
   *
   * It stays an `<a href>` rather than becoming a button, so everything a link can do still works:
   * `event.detail === 0` marks a keyboard activation and is allowed through, so Enter opens, and
   * modified clicks are left alone so Cmd/Ctrl-click, middle-click and "copy link" behave normally.
   */
  function selectInsteadOfOpening(event: MouseEvent<HTMLAnchorElement>, item: RssItem) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (event.detail === 0) {
      setSourceItem(item);
      return;
    }
    event.currentTarget.focus();
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
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(460px,1.2fr)_minmax(320px,.8fr)]">
      <div className="card">
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

          <div className="flex items-center gap-2">
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
            {/* Clicking no longer opens anything, so the list says what it does instead of leaving it
                to be discovered. */}
            <p className="mt-4 hidden flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-faint sm:flex">
              <span><kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> gez</span>
              <span aria-hidden="true">·</span>
              <span><kbd className="font-sans">Enter</kbd> önizlemeyi aç</span>
              <span aria-hidden="true">·</span>
              <span><kbd className="font-sans">m</kbd> okundu/okunmadı</span>
              <span aria-hidden="true">·</span>
              <span>üstüne geldiğin başlık okundu sayılır</span>
            </p>

            <ul id="rss-items" ref={listRef} onKeyDown={onListKeyDown} className="mt-2 divide-y divide-line">
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
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-rss-title
                      tabIndex={item.id === activeId ? 0 : -1}
                      onFocus={() => onRowFocus(item)}
                      onClick={(event) => selectInsteadOfOpening(event, item)}
                      className={titleClass(item.read)}
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span data-rss-title tabIndex={item.id === activeId ? 0 : -1} onFocus={() => onRowFocus(item)} className={titleClass(item.read)}>
                      {item.title}
                    </span>
                  )}

                  {/* With a click no longer opening the source, the mouse needs a way in of its own. */}
                  {item.link && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setSourceItem(item)}
                      aria-label={`“${item.title}” kaynağını modalda aç`}
                      title="Kaynağı modalda aç"
                      className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-0 transition-opacity hover:bg-surface-3 hover:text-ink group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                      <ArrowUpRight className="size-[18px]" aria-hidden="true" />
                    </button>
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

      {selectedItem && (
        <aside className="card xl:sticky xl:top-4" aria-labelledby="rss-item-summary-title">
          <p className="text-[12px] font-bold uppercase tracking-[.12em] text-faint">Haber açıklaması</p>
          <h2 id="rss-item-summary-title" className="mt-3 text-[24px] font-bold leading-[1.25] tracking-[-.035em] text-ink">
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
            <button
              type="button"
              onClick={() => setSourceItem(selectedItem)}
              className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
            >
              Haberi kaynağında aç <ArrowUpRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </aside>
      )}

      {sourceItem && (
        <RssDialog
          title={sourceItem.title}
          onClose={() => setSourceItem(null)}
          initialFocusRef={sourceExternalRef}
          panelClassName="!max-w-[1440px]"
        >
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="min-w-0 truncate text-[13px] font-medium text-muted">{sourceItem.feedTitle}</p>
            <a
              ref={sourceExternalRef}
              href={sourceItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
            >
              Yeni sekmede aç <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
          <iframe
            src={sourceItem.link}
            title={`${sourceItem.title} kaynağı`}
            loading="eager"
            referrerPolicy="no-referrer"
            sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="mt-4 h-[65dvh] w-full rounded-panel border border-line bg-white"
          />
        </RssDialog>
      )}
    </div>
  );
}
