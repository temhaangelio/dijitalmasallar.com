"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, PanelLeftClose, PanelLeftOpen, Pause, Pencil, Play, Rss, Trash2 } from "lucide-react";
import { removeFeedAction, toggleFeedAction } from "@/app/(dashboard)/rss/actions";
import { RssRenameFeedDialog } from "@/components/features/rss/rss-rename-feed-dialog";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import type { RssFeed } from "@/services/rss";

function UnreadBadge({ count, onDark }: { count: number; onDark: boolean }) {
  return (
    <span
      aria-label={`${count} okunmamış`}
      className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none tabular-nums ${onDark ? "bg-white text-ink" : "bg-surface-3 text-ink-2"}`}
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
      <div id="rss-feed-panel" className={collapsed ? "absolute left-1 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2" : "card overflow-hidden p-0 xl:flex xl:min-h-0 xl:flex-col"}>
        {collapsed ? (
          <button
            type="button"
            aria-label="Kaynak listesini aç"
            aria-expanded="false"
            aria-controls="rss-feed-panel"
            title="Kaynak listesini aç"
            onClick={() => onCollapsedChange(false)}
            className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted shadow-soft transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
            {unreadTotal > 0 && <span className="absolute -right-1.5 -top-1.5"><UnreadBadge count={unreadTotal} onDark={false} /></span>}
          </button>
        ) : (
          <>
            <div className="border-b border-line px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <h2 className="text-[15px] font-semibold text-ink">Kaynaklar</h2>
                  <span className="text-[11px] font-medium text-muted">{feeds.length}</span>
                </div>
                <button
                  type="button"
                  aria-label="Kaynak listesini sola kapat"
                  aria-expanded="true"
                  aria-controls="rss-feed-panel"
                  title="Kaynak listesini sola kapat"
                  onClick={() => onCollapsedChange(true)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <PanelLeftClose className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="flex flex-col gap-0.5 p-2 xl:min-h-0 xl:overflow-y-auto" aria-label="Takip edilen kaynaklar">
              <Link
                href="/rss"
                aria-current={activeFeedId ? undefined : "page"}
                className={`mb-1 flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 text-[13px] transition-colors ${activeFeedId ? "font-medium text-ink-2 hover:bg-surface-2" : "bg-surface-2 font-semibold text-ink"}`}
              >
                <span className="flex items-center gap-2"><Rss className="size-3.5 text-muted" aria-hidden="true" />Tüm haberler</span>
                <UnreadBadge count={unreadTotal} onDark={false} />
              </Link>

              {feeds.length === 0 && (
                <div className="px-3 py-7 text-center">
                  <p className="text-[13px] font-semibold text-ink-2">Henüz kaynak yok</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted">Takip etmek istediğiniz sitenin RSS adresini ekleyin.</p>
                </div>
              )}

              {feeds.map((feed) => {
                const selected = feed.id === activeFeedId;
                return (
                  <div key={feed.id} className={`group flex items-center gap-0.5 rounded-xl pr-1 transition-colors ${selected ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2/70"}`}>
                    <Link href={`/rss?feed=${feed.id}`} aria-current={selected ? "page" : undefined} title={hostname(feed.url)} className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5">
                      {feed.lastError ? <AlertCircle className="size-3.5 shrink-0 text-danger" aria-label={`Hata: ${feed.lastError}`} /> : <span className={`size-1.5 shrink-0 rounded-full ${feed.active ? "bg-line-strong" : "bg-muted"}`} aria-label={feed.active ? "Aktif" : "Duraklatıldı"} />}
                      <span className={`block min-w-0 flex-1 truncate text-[13px] ${selected ? "font-semibold" : "font-medium"}`}>{feed.title || hostname(feed.url)}</span>
                    </Link>
                    <UnreadBadge count={feed.unreadCount} onDark={false} />
                    <ActionMenu
                      label={`${feed.title || feed.url} kaynağı işlemleri`}
                      triggerClassName="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
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
