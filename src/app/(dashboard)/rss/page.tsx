import { redirect } from "next/navigation";
import { RssAddFeedButton } from "@/components/features/rss/rss-add-feed-dialog";
import { RssReaderLayout } from "@/components/features/rss/rss-reader-layout";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { isRssReaderAvailable } from "@/lib/rss/availability";
import { listFeeds, listItems } from "@/services/rss";

/** The reader reflects a local file that changes on every refresh, so nothing here may be cached. */
export const dynamic = "force-dynamic";

function lastFetchNote(value: string | null) {
  if (!value) return "henüz taranmadı";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "az önce tarandı";
  if (minutes < 60) return `${minutes} dk önce tarandı`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat önce tarandı`;
  return `${Math.round(hours / 24)} gün önce tarandı`;
}

export default async function RssPage({ searchParams }: { searchParams: Promise<{ feed?: string; filter?: string }> }) {
  const params = await searchParams;
  if (!isRssReaderAvailable()) redirect("/dashboard");

  const feeds = listFeeds();
  // An id left in the URL after its feed was deleted falls back to the combined view.
  const activeFeedId = feeds.some((feed) => feed.id === params.feed) ? params.feed : undefined;
  // Unread is the default view; seeing everything is the deliberate step, hence `filter=all`.
  const unreadOnly = params.filter !== "all";
  const items = listItems({ feedId: activeFeedId, unreadOnly });

  const unreadTotal = feeds.reduce((total, feed) => total + feed.unreadCount, 0);
  const lastFetchedAt = feeds.reduce<string | null>((latest, feed) => (feed.lastFetchedAt && (!latest || feed.lastFetchedAt > latest) ? feed.lastFetchedAt : latest), null);

  return (
    <AppShell active="/rss">
      <div className="w-full xl:flex xl:h-[calc(100dvh-72px)] xl:min-h-0 xl:flex-col">
        <PageHeader
          title="RSS"
          note={`${feeds.length} kaynak · ${unreadTotal} okunmamış · ${lastFetchNote(lastFetchedAt)}`}
          actions={<RssAddFeedButton />}
        />
        <RssReaderLayout feeds={feeds} items={items} activeFeedId={activeFeedId} unreadOnly={unreadOnly} unreadTotal={unreadTotal} />
      </div>
    </AppShell>
  );
}
