"use client";

import { useSyncExternalStore } from "react";
import { RssFeedPanel } from "@/components/features/rss/rss-feed-panel";
import { RssItemsList } from "@/components/features/rss/rss-items-list";
import type { RssFeed, RssItem } from "@/services/rss";

const sourcesCollapsedStorageKey = "diji-news:rss-sources-collapsed";
const sourcesCollapsedEvent = "diji-news:rss-sources-change";

function subscribeToSourcesCollapsed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(sourcesCollapsedEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(sourcesCollapsedEvent, onStoreChange);
  };
}

function getSourcesCollapsed() {
  try { return window.localStorage.getItem(sourcesCollapsedStorageKey) === "true"; }
  catch { return false; }
}

export function RssReaderLayout({
  feeds,
  items,
  activeFeedId,
  unreadOnly,
  unreadTotal,
}: {
  feeds: RssFeed[];
  items: RssItem[];
  activeFeedId?: string;
  unreadOnly: boolean;
  unreadTotal: number;
}) {
  const sourcesCollapsed = useSyncExternalStore(subscribeToSourcesCollapsed, getSourcesCollapsed, () => false);

  function changeSourcesCollapsed(collapsed: boolean) {
    try {
      window.localStorage.setItem(sourcesCollapsedStorageKey, String(collapsed));
      window.dispatchEvent(new Event(sourcesCollapsedEvent));
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }

  return (
    <div
      className={`relative xl:min-h-0 xl:flex-1 ${
        sourcesCollapsed ? "block" : "grid items-start gap-5 transition-[grid-template-columns] duration-300 xl:grid-cols-[248px_minmax(0,1fr)] xl:items-stretch"
      }`}
    >
      <RssFeedPanel
        feeds={feeds}
        activeFeedId={activeFeedId}
        unreadTotal={unreadTotal}
        collapsed={sourcesCollapsed}
        onCollapsedChange={changeSourcesCollapsed}
      />
      <RssItemsList
        key={`${activeFeedId ?? "all"}-${unreadOnly ? "unread" : "all"}`}
        items={items}
        activeFeedId={activeFeedId}
        unreadOnly={unreadOnly}
        hasFeeds={feeds.length > 0}
      />
    </div>
  );
}
