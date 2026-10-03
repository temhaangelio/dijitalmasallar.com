import { getFeedPagination } from "@/lib/feed-pagination";
import Image from "next/image";
import type { Metadata } from "next";
import { AutoLoadMore } from "@/components/features/visitor/auto-load-more";
import { DailyAudioRow } from "@/components/features/visitor/daily-audio-player";
import { FeedScrollMemory } from "@/components/features/visitor/feed-scroll-memory";
import { VisitorFloatingNav } from "@/components/features/visitor/visitor-floating-nav";
import { NewsletterPromo } from "@/components/features/visitor/newsletter-promo";
import { NoteCard } from "@/components/features/visitor/note-card";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getDailyAudioSince } from "@/services/daily-audio";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";
import { isOptimizableImage } from "@/lib/images";
import { absoluteUrl, jsonLd, postHeadline, siteUrl } from "@/lib/seo";
import { bulletinDays, dateKey, dateLabel, relativeDayLabel } from "@/lib/visitor-date";
import { languageHref, resolveVisitorLanguage, siteNameFor } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const baseUrl = siteUrl(settings.domain);
  const description = language === "en" ? settings.descriptionEn : settings.description;
  const canonical = languageHref("/", language);
  // `absolute` stops the root layout template from appending a second brand name.
  return {
    title: { absolute: siteNameFor(settings.siteName, language) },
    description,
    alternates: {
      canonical,
      languages: { tr: "/", en: "/?lang=en", "x-default": "/" },
      types: { "application/rss+xml": languageHref("/feed.xml", language) },
    },
    openGraph: {
      type: "website",
      siteName: siteNameFor(settings.siteName, language),
      title: siteNameFor(settings.siteName, language),
      description,
      url: absoluteUrl(baseUrl, canonical),
      locale: language === "en" ? "en_US" : "tr_TR",
      alternateLocale: [language === "en" ? "tr_TR" : "en_US"],
    },
    twitter: { card: "summary", title: siteNameFor(settings.siteName, language), description },
  };
}

/** An ad is an entry among the notes: the same column, marked as an ad in its meta line. */
function AdCard({ ad }: { ad: Advertisement }) {
  return (
    <a
      href={ad.target_url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label={`${ad.label}: ${ad.title}`}
      className="feed-note feed-ad group relative block"
    >
      <span className="feed-note-meta visitor-sans"><span className="feed-ad-label">{ad.label}</span></span>
      <span className="feed-note-title visitor-copy visitor-sans block text-ink [text-wrap:pretty]">{ad.title}</span>
      {ad.image_url ? (
        <span className="feed-note-cover relative block aspect-video w-full overflow-hidden rounded-[8px] bg-surface-3">
          {isOptimizableImage(ad.image_url)
            ? <Image src={ad.image_url} alt="" fill sizes="(max-width: 680px) calc(100vw - 32px), 600px" className="object-cover" />
            // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
            : <img src={ad.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
        </span>
      ) : null}
      {ad.description ? <span className="feed-note-body visitor-copy visitor-sans block whitespace-pre-line text-ink [text-wrap:pretty]">{ad.description}</span> : null}
      <span className="feed-note-foot visitor-sans">
        <span className="feed-note-source min-w-0 truncate text-muted transition-colors group-hover:text-ink">
          {ad.cta_label}
          <svg className="ml-1 inline-block size-2.5 align-baseline" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg>
        </span>
      </span>
    </a>
  );
}

const adInterval = 6;

/** Places an ad after every sixth note and cycles through the active ads in order. */
function createAdSlots(postCount: number, ads: Advertisement[]) {
  const slots = new Map<number, Advertisement>();
  if (postCount < adInterval || !ads.length) return slots;
  for (let position = adInterval - 1, adIndex = 0; position < postCount; position += adInterval, adIndex++) {
    slots.set(position, ads[adIndex % ads.length]);
  }
  return slots;
}

/**
 * The feed is read a day at a time, so it is rendered a day at a time: each day is its own section
 * with its own heading.
 *
 * The flat feed position travels with every note, because the ad slots were drawn
 * against the ungrouped list and must not shift when the notes are bucketed.
 */
/** Each note carries an anchor, so a link can land on it. */
function noteAnchorId(postId: string) {
  return `not-${postId}`;
}

function groupPostsByDay(posts: Post[]) {
  const days: { key: string; publishedAt: string; items: { post: Post; position: number }[] }[] = [];
  posts.forEach((post, position) => {
    const publishedAt = post.published_at ?? post.created_at;
    const key = dateKey(publishedAt);
    const current = days[days.length - 1];
    if (current && current.key === key) current.items.push({ post, position });
    else days.push({ key, publishedAt, items: [{ post, position }] });
  });
  return days;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string; limit?: string }> }) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const language = resolveVisitorLanguage(params.lang);
  const pagination = getFeedPagination(settings.postsPerPage, params.limit);
  const visiblePostCount = pagination.visibleCount;
  if (settings.maintenanceMode) return <main className="visitor-page grid min-h-screen place-items-center bg-canvas px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-field bg-ink" /><h1 className="text-[length:var(--vt-h1)] font-bold tracking-[-.05em]">{siteNameFor(settings.siteName, language)}</h1><p className="mt-3 text-[length:var(--vt-small)] text-muted">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  // One extra row is enough to decide whether the automatic "more notes" control is needed.
  const fetchCount = pagination.fetchCount;
  const [postData, ads] = await Promise.all([
    getPosts(1, fetchCount, language),
    settings.moduleAds ? getActiveAds(language) : Promise.resolve([]),
  ]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = pagination.canLoadMore && publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
  /*
   * Every published recording takes its place in the feed by the time it went out, like a note.
   * While older notes are still to load, only the recordings back to the oldest note shown are
   * fetched; the rest arrive with the notes of their days.
   */
  const oldestShown = posts.length ? (posts[posts.length - 1].published_at ?? posts[posts.length - 1].created_at) : null;
  const recordings = await getDailyAudioSince(language, hasMorePosts ? oldestShown : null);
  const postDays = groupPostsByDay(posts);
  const adSlots = createAdSlots(posts.length, ads);
  const baseUrl = siteUrl(settings.domain);
  const homeUrl = absoluteUrl(baseUrl, languageHref("/", language));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": `${baseUrl}/#organization`,
        name: siteNameFor(settings.siteName, language),
        url: baseUrl,
        description: language === "en" ? settings.descriptionEn : settings.description,
        email: settings.contactEmail,
        founder: { "@type": "Person", name: "Temha Angelio", url: "https://www.temhaangelio.com/" },
        knowsAbout: ["Technology", "Artificial intelligence", "Science", "Digital culture"],
        /* The publisher's logo is what a news result draws next to the headline, and the article
           pages point their `publisher` at this same node — so it is defined once, here. */
        logo: { "@type": "ImageObject", url: absoluteUrl(baseUrl, "/icon-512.png"), width: 512, height: 512 },
        image: absoluteUrl(baseUrl, "/icon-512.png"),
        /* The accounts that are demonstrably the same publisher. This is how a search engine — and
           an assistant answering "who writes dijitalmasallar" — ties the site to its author instead
           of treating the two as unrelated strangers. */
        sameAs: ["https://www.instagram.com/temhaangelio", "https://www.temhaangelio.com/"],
        availableLanguage: ["tr", "en"],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: siteNameFor(settings.siteName, language),
        url: homeUrl,
        inLanguage: language,
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: { "@type": "ReadAction", target: homeUrl },
      },
      {
        "@type": "CollectionPage",
        "@id": `${homeUrl}#webpage`,
        url: homeUrl,
        name: siteNameFor(settings.siteName, language),
        description: language === "en" ? settings.descriptionEn : settings.description,
        inLanguage: language,
        isPartOf: { "@id": `${baseUrl}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: posts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: postHeadline(post),
            url: absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, language)),
          })),
        },
      },
    ],
  };

  const { today: todayKey, yesterday: yesterdayKey } = bulletinDays();
  const audioTitle = (day: string) => day === todayKey
    ? (language === "en" ? "Today’s briefing" : "Bugünün bülteni")
    : day === yesterdayKey ? (language === "en" ? "Yesterday’s briefing" : "Dünün bülteni") : (language === "en" ? "Audio briefing" : "Sesli bülten");
  const recordingByDay = new Map(recordings.map((recording) => [recording.day, recording]));
  /*
   * A day's recording sits directly under that day's heading. A recording whose day has no notes
   * (only once every note is loaded, so an older day cannot be shown before its notes) gets a day
   * heading of its own, in its place in the order.
   */
  const dayKeys = new Set(postDays.map((day) => day.key));
  const days: { key: string; publishedAt: string; items: { post: Post; position: number }[] }[] = [];
  const orphanRecordings = hasMorePosts ? [] : recordings.filter((recording) => !dayKeys.has(recording.day));
  const orphanQueue = [...orphanRecordings];
  for (const day of postDays) {
    while (orphanQueue.length && orphanQueue[0].day > day.key) {
      const recording = orphanQueue.shift()!;
      days.push({ key: recording.day, publishedAt: recording.publishedAt, items: [] });
    }
    days.push(day);
  }
  for (const recording of orphanQueue) days.push({ key: recording.day, publishedAt: recording.publishedAt, items: [] });
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <h1 className="sr-only">{siteNameFor(settings.siteName, language)}</h1>
      <main className="visitor-feed feed-column relative flex w-full flex-col">
        {posts.length ? (
          <div className="feed-days">
            {days.map((day) => {
              const recording = recordingByDay.get(day.key);
              return (
                <section key={day.key} className="feed-day" aria-label={dateLabel(day.publishedAt, language)}>
                  <h2 className="feed-day-heading visitor-sans" title={dateLabel(day.publishedAt, language)}>
                    <span className="feed-day-name">{relativeDayLabel(day.publishedAt, language)}</span>
                    {relativeDayLabel(day.publishedAt, language) !== dateLabel(day.publishedAt, language)
                      ? <span className="feed-day-date">{dateLabel(day.publishedAt, language)}</span>
                      : null}
                  </h2>
                  {recording ? <DailyAudioRow title={audioTitle(recording.day)} day={recording.day} durationSeconds={recording.durationSeconds} language={language} /> : null}
                  <div className="feed-day-notes">
                    {day.items.flatMap(({ post, position }) => {
                      const nodes = [
                        <div key={post.id} id={noteAnchorId(post.id)} className="visitor-note-anchor">
                          <NoteCard post={post} language={language} priority={position < 2} latest={position === 0} />
                        </div>,
                      ];
                      if (adSlots.has(position)) nodes.push(<AdCard key={`ad-${position}`} ad={adSlots.get(position)!} />);
                      return nodes;
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="visitor-muted px-2 py-16 text-center">
            <p className="visitor-copy text-[length:var(--vt-small)] font-medium text-muted">{language === "en" ? "No English notes have been published yet." : "Henüz Türkçe not yayınlanmadı."}</p>
            <p className="visitor-muted mt-2 text-[length:var(--vt-ui)] text-muted">{language === "en" ? "New notes land here through the day." : "Yeni notlar gün boyunca buraya düşer."}</p>
          </div>
        )}

        {hasMorePosts && (() => {
          const nextHref = languageHref("/", language, { limit: pagination.nextCount });
          const label = language === "en" ? "Loading more notes" : "Yeni notlar yükleniyor";
          return (
            <>
              <AutoLoadMore href={nextHref} label={label} />
              {/* Without scripting there is no observer to fire, so the feed keeps a plain link. */}
              <noscript>
                <div className="flex justify-center py-14">
                  <a href={nextHref} className="border-b border-ink pb-1.5 visitor-sans text-[11px] font-medium uppercase tracking-[.18em] text-ink hover:border-accent hover:text-accent">
                    {language === "en" ? "More notes" : "Daha fazla not"}
                  </a>
                </div>
              </noscript>
            </>
          );
        })()}
        {!hasMorePosts && posts.length ? <NewsletterPromo language={language} /> : null}
      </main>
      <VisitorFloatingNav language={language} />
      <FeedScrollMemory />
    </VisitorShell>
  );
}
