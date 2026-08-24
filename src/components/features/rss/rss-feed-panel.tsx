"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, PanelLeftClose, PanelLeftOpen, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { removeFeedAction, toggleFeedAction } from "@/app/(dashboard)/rss/actions";
import { RssAddFeedButton } from "@/components/features/rss/rss-add-feed-dialog";
import { RssRenameFeedDialog } from "@/components/features/rss/rss-rename-feed-dialog";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import type { RssFeed } from "@/services/rss";

function UnreadBadge({ count, onDark }: { count: number; onDark: boolean }) {
  return (
    <span
      aria-label={`${count} okunmamış`}
      // Raised off the baseline so it reads as a superscript on the name rather than a second word.
      className={`relative -top-1.5 inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none tabular-nums ${onDark ? "bg-white text-ink" : "bg-ink text-white"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function hostname(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; }
}

/** Left column: add a feed, then switch between the feeds already followed. */
export function RssFeedPanel({
  feeds,
  activeFeedId,
  unreadTotal,
  collapsed,
  onCollapsedChange,
}: {
  feeds: RssFeed[];
  activeFeedId?: string;
  unreadTotal: number;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [feedToRemove, setFeedToRemove] = useState<RssFeed | null>(null);
  const [feedToRename, setFeedToRename] = useState<RssFeed | null>(null);

  function toggle(feed: RssFeed, active: boolean) {
    startTransition(async () => {
      const result = await toggleFeedAction(feed.id, active);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) router.refresh();
    });
  }

  async function removeSelected() {
    if (!feedToRemove) return false;
    const result = await removeFeedAction(feedToRemove.id);
    showToast(result.message, result.success ? "success" : "error");
    // Dropping the selected feed would otherwise leave the page filtered by an id that no longer exists.
    if (result.success) router.replace("/rss");
    return result.success;
  }

  return (
    <>
      <div id="rss-feed-panel" className={collapsed ? "flex justify-start lg:justify-center" : "card space-y-5"}>
        {collapsed ? (
          <button
            type="button"
            aria-label="Kaynak listesini aç"
            aria-expanded="false"
            aria-controls="rss-feed-panel"
            title="Kaynak listesini aç"
            onClick={() => onCollapsedChange(false)}
            className="grid size-11 shrink-0 place-items-center rounded-chip bg-surface text-muted shadow-soft transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
          </button>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h2 className="section-title">Kaynaklar</h2>
              <div className="flex items-center gap-2">
                <RssAddFeedButton variant="secondary" size="sm" />
                <button
                  type="button"
                  aria-label="Kaynak listesini sola kapat"
                  aria-expanded="true"
                  aria-controls="rss-feed-panel"
                  title="Kaynak listesini sola kapat"
                  onClick={() => onCollapsedChange(true)}
                  className="grid size-9 shrink-0 place-items-center rounded-chip text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <PanelLeftClose className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Takip edilen kaynaklar">
              <Link
                href="/rss"
                aria-current={activeFeedId ? undefined : "page"}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-chip px-4 text-[15px] transition-colors ${activeFeedId ? "font-medium text-ink-2 hover:bg-surface-2" : "bg-ink font-semibold text-white"}`}
              >
                <span>Tüm kaynaklar</span>
                {unreadTotal > 0 && <UnreadBadge count={unreadTotal} onDark={!activeFeedId} />}
              </Link>

              {feeds.map((feed) => {
                const selected = feed.id === activeFeedId;
                return (
                  <div key={feed.id} className={`group flex items-center gap-2 rounded-chip pr-2 transition-colors ${selected ? "bg-ink text-white" : "hover:bg-surface-2"}`}>
                    <Link href={`/rss?feed=${feed.id}`} aria-current={selected ? "page" : undefined} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center px-4 py-2">
                      {/*
                        One line per source. The badge rides above the name's first character, and the
                        two exceptional states — broken, paused — take the same slot as an icon with the
                        detail on hover, so a source in trouble still says so without costing a row.
                      */}
                      <span className="flex min-w-0 items-center gap-1.5">
                        {feed.lastError ? (
                          <span title={feed.lastError} className="relative -top-1 flex shrink-0"><AlertCircle className="size-3.5 text-danger" aria-label={`Hata: ${feed.lastError}`} /></span>
                        ) : !feed.active ? (
                          <span title="Duraklatıldı" className={`relative -top-1 flex shrink-0 ${selected ? "text-white/70" : "text-muted"}`}><Pause className="size-3.5" aria-label="Duraklatıldı" /></span>
                        ) : feed.unreadCount > 0 ? (
                          <UnreadBadge count={feed.unreadCount} onDark={selected} />
                        ) : null}
                        <span className={`truncate text-[15px] ${selected ? "font-semibold" : "font-medium text-ink-2"}`}>{feed.title || hostname(feed.url)}</span>
                      </span>
                    </Link>
                    <ActionMenu
                      label={`${feed.title || feed.url} kaynağı işlemleri`}
                      triggerClassName={selected ? "text-white/70 hover:bg-white/10 hover:text-white" : undefined}
                      items={[
                        {
                          label: "Adı düzenle",
                          icon: <Pencil size={15} aria-hidden="true" />,
                          onSelect: () => setFeedToRename(feed),
                        },
                        {
                          label: feed.active ? "Takibi duraklat" : "Takibi sürdür",
                          icon: feed.active ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />,
                          onSelect: () => toggle(feed, !feed.active),
                        },
                        {
                          label: "Kaynağı sil",
                          destructive: true,
                          icon: <Trash2 size={15} aria-hidden="true" />,
                          onSelect: () => setFeedToRemove(feed),
                        },
                      ]}
                    />
                  </div>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Mounted only while open, so the field always starts from the source's current name. */}
      {feedToRename && <RssRenameFeedDialog feed={feedToRename} onClose={() => setFeedToRename(null)} />}

      <ConfirmDialog
        open={Boolean(feedToRemove)}
        title="Kaynak silinsin mi?"
        description={feedToRemove ? `“${feedToRemove.title || hostname(feedToRemove.url)}” ve bu kaynaktan alınan ${feedToRemove.itemCount} içerik kalıcı olarak silinecek.` : "Bu işlem geri alınamaz."}
        confirmLabel="Kaynağı sil"
        variant="destructive"
        onOpenChange={(open) => !open && setFeedToRemove(null)}
        onConfirm={removeSelected}
      />
    </>
  );
}
