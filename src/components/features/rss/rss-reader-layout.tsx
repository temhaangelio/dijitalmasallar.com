"use client";

import { useState } from "react";
import { RssFeedPanel } from "@/components/features/rss/rss-feed-panel";
import { RssItemsList } from "@/components/features/rss/rss-items-list";
import type { RssFeed, RssItem } from "@/services/rss";

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
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);

  return (
    <div
      className={`grid items-start gap-5 transition-[grid-template-columns] duration-300 ${
        sourcesCollapsed ? "lg:grid-cols-[56px_minmax(0,1fr)]" : "lg:grid-cols-[340px_minmax(0,1fr)]"
      }`}
    >
      <RssFeedPanel
        feeds={feeds}
        activeFeedId={activeFeedId}
        unreadTotal={unreadTotal}
        collapsed={sourcesCollapsed}
        onCollapsedChange={setSourcesCollapsed}
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
