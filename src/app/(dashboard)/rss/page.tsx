import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RssAddFeedButton } from "@/components/features/rss/rss-add-feed-dialog";
import { RssReaderLayout } from "@/components/features/rss/rss-reader-layout";
import { buttonVariants } from "@/components/ui/button";
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
    <main className="admin-page min-h-dvh px-4 py-5 sm:px-6 sm:py-7 lg:px-10 xl:h-dvh xl:overflow-hidden">
      <div className="mx-auto w-full max-w-[1600px] xl:flex xl:h-full xl:flex-col">
        <header className="grid gap-3 pb-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="justify-self-start">
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Panele geri dön
            </Link>
          </div>
          <div className="text-center">
            <h1 className="page-title">RSS</h1>
            <p className="page-note">{feeds.length} kaynak · {unreadTotal} okunmamış · {lastFetchNote(lastFetchedAt)}</p>
          </div>
          <div className="justify-self-start sm:justify-self-end">
            <RssAddFeedButton />
          </div>
        </header>
        <RssReaderLayout feeds={feeds} items={items} activeFeedId={activeFeedId} unreadOnly={unreadOnly} unreadTotal={unreadTotal} />
      </div>
    </main>
  );
}
