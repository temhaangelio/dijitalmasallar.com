import Link from "next/link";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { RssAddFeedButton } from "@/components/features/rss/rss-add-feed-dialog";
import { RssReaderLayout } from "@/components/features/rss/rss-reader-layout";
import { isRssReaderAvailable } from "@/lib/rss/availability";
import { listFeeds, listItems } from "@/services/rss";
import { getSiteSettings } from "@/services/settings";

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
  const [params, settings] = await Promise.all([searchParams, getSiteSettings()]);
  // AppShell used to enforce this while also rendering the dashboard sidebar. Keep the gate even
  // though the reader now has its own full-page shell.
  if (!settings.moduleRss || !isRssReaderAvailable()) redirect("/dashboard");

  const feeds = listFeeds();
  // An id left in the URL after its feed was deleted falls back to the combined view.
  const activeFeedId = feeds.some((feed) => feed.id === params.feed) ? params.feed : undefined;
  // Unread is the default view; seeing everything is the deliberate step, hence `filter=all`.
  const unreadOnly = params.filter !== "all";
  const items = listItems({ feedId: activeFeedId, unreadOnly });

  const unreadTotal = feeds.reduce((total, feed) => total + feed.unreadCount, 0);
  const lastFetchedAt = feeds.reduce<string | null>((latest, feed) => (feed.lastFetchedAt && (!latest || feed.lastFetchedAt > latest) ? feed.lastFetchedAt : latest), null);

  return (
    <main className="min-h-dvh bg-ink/10 p-2 sm:p-4">
      <section
        aria-labelledby="rss-reader-title"
        className="mx-auto min-h-[calc(100dvh-1rem)] max-w-[1920px] overflow-clip rounded-[24px] bg-canvas shadow-[0_24px_80px_rgba(0,0,0,.18)] sm:min-h-[calc(100dvh-2rem)] sm:rounded-[30px]"
      >
        <header className="flex items-center justify-between gap-5 border-b border-line px-5 py-4 sm:px-7 lg:px-9">
          <div className="min-w-0">
            <h1 id="rss-reader-title" className="text-[28px] font-bold leading-none tracking-[-.045em] text-ink">RSS</h1>
            <p className="mt-1.5 truncate text-[14px] font-medium text-muted">
              {feeds.length} kaynak · {unreadTotal} okunmamış · {lastFetchNote(lastFetchedAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <RssAddFeedButton />
            <Link
              href="/dashboard"
              aria-label="RSS okuyucuyu kapat"
              title="Kapat"
              className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <RssReaderLayout feeds={feeds} items={items} activeFeedId={activeFeedId} unreadOnly={unreadOnly} unreadTotal={unreadTotal} />
        </div>
      </section>
    </main>
  );
}
