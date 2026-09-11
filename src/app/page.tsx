import { getFeedPagination } from "@/lib/feed-pagination";
import Image from "next/image";
import type { Metadata } from "next";
import { AutoLoadMore } from "@/components/features/visitor/auto-load-more";
import { FeedRefresh } from "@/components/features/visitor/feed-refresh";
import { FeedViewPicker } from "@/components/features/visitor/feed-view-picker";
import { NoteCard } from "@/components/features/visitor/note-card";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";
import { isOptimizableImage } from "@/lib/images";
import { absoluteUrl, jsonLd, postHeadline, siteUrl } from "@/lib/seo";
import { dateKey } from "@/lib/visitor-date";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
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
    title: { absolute: settings.siteName },
    description,
    alternates: {
      canonical,
      languages: { tr: "/", en: "/?lang=en", "x-default": "/" },
      types: { "application/rss+xml": languageHref("/feed.xml", language) },
    },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.siteName,
      description,
      url: absoluteUrl(baseUrl, canonical),
      locale: language === "en" ? "en_US" : "tr_TR",
      alternateLocale: [language === "en" ? "tr_TR" : "en_US"],
    },
    twitter: { card: "summary", title: settings.siteName, description },
  };
}

/** Ads span all desktop columns; mobile keeps the reading-card layout. */
function AdCard({ ad }: { ad: Advertisement }) {
  return (
    <div className="visitor-ad-slot xl:col-span-full">
      <a
        href={ad.target_url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label={`${ad.label}: ${ad.title}`}
        className="visitor-card group block transition-colors hover:border-line-strong xl:flex xl:flex-1 xl:flex-col"
      >
        <div className={`visitor-ad-content min-w-0 flex-1 px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6${ad.image_url ? " visitor-ad-with-image" : ""}`}>
          <span className="visitor-note-time visitor-sans">{ad.label}</span>

          <h2 className="visitor-ad-title visitor-copy visitor-serif block text-ink transition-colors [text-wrap:pretty] group-hover:text-accent">{ad.title}</h2>

          {ad.image_url ? (
            <div className="visitor-ad-image relative mt-5 block aspect-video w-full overflow-hidden rounded-[10px] bg-surface-3">
              {isOptimizableImage(ad.image_url)
                ? <Image src={ad.image_url} alt="" fill sizes="(max-width: 680px) calc(100vw - 72px), (min-width: 1280px) 340px, 590px" className="object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
                // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
                : <img src={ad.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />}
            </div>
          ) : null}

          {ad.description ? (
            <p className="visitor-note-body visitor-copy visitor-serif mt-5 whitespace-pre-line text-[18px] font-normal leading-[1.65] text-ink [text-wrap:pretty] sm:text-[20px] sm:leading-[1.6] xl:mt-3">{ad.description}</p>
          ) : null}

          <div className="mt-5 flex min-w-0 items-center justify-between gap-3 pt-2 visitor-sans text-[12px] font-normal leading-[1.6] xl:mt-auto xl:pt-1">
            <span className="visitor-source min-w-0 truncate text-muted transition-colors group-hover:text-accent">
              {ad.cta_label}
              <svg className="ml-1 inline-block size-2.5 align-baseline" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg>
            </span>
          </div>
        </div>
      </a>
    </div>
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
  if (settings.maintenanceMode) return <main className="visitor-page grid min-h-screen place-items-center bg-canvas px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-field bg-ink" /><h1 className="text-[length:var(--vt-h1)] font-bold tracking-[-.05em]">{settings.siteName}</h1><p className="mt-3 text-[length:var(--vt-small)] text-muted">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  // One extra row is enough to decide whether the automatic "more notes" control is needed.
  const fetchCount = pagination.fetchCount;
  const [postData, ads] = await Promise.all([
    getPosts(1, fetchCount, language),
    settings.moduleAds ? getActiveAds(language) : Promise.resolve([]),
  ]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = pagination.canLoadMore && publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
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
        name: settings.siteName,
        url: baseUrl,
        description: language === "en" ? settings.descriptionEn : settings.description,
        email: settings.contactEmail,
        founder: { "@type": "Person", name: "Temha Angelio", url: "https://www.temhaangelio.com/" },
        knowsAbout: ["Technology", "Artificial intelligence", "Science", "Digital culture"],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: settings.siteName,
        url: homeUrl,
        inLanguage: language,
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: { "@type": "ReadAction", target: homeUrl },
      },
      {
        "@type": "CollectionPage",
        "@id": `${homeUrl}#webpage`,
        url: homeUrl,
        name: settings.siteName,
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

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <h1 className="sr-only">{settings.siteName}</h1>
      <main className="visitor-feed visitor-viewable-feed relative mt-6 flex w-full max-w-[640px] flex-col sm:mt-9">
        <div className="visitor-feed-tools">
          <FeedViewPicker language={language} />
          <FeedRefresh language={language} />
        </div>
        <div>
        {posts.length ? (
          <>
          {/*
            One list, two shapes.

            On phones it is a single column; desktop readers can choose cards or horizontal rows.
            Both layouts share the same content, chronological order and full-width ad slots.
          */}
          <div className="visitor-feed-grid flex flex-col gap-8 sm:gap-10 xl:grid xl:grid-cols-2 xl:items-stretch xl:gap-6">
            {(() => {
              return postDays.flatMap((day) => day.items.flatMap(({ post, position }) => {
                const nodes = [];
                nodes.push(
                  <div key={post.id} id={noteAnchorId(post.id)} className="visitor-note-anchor group/note relative xl:flex xl:flex-col">
                    <NoteCard post={post} language={language} priority={position === 0} latest={position === 0} layout="grid" />
                  </div>,
                );
                if (adSlots.has(position)) {
                  nodes.push(<AdCard key={`ad-${position}`} ad={adSlots.get(position)!} />);
                }
                return nodes;
              }));
            })()}
          </div>
          </>
        ) : (
          <div className="visitor-panel visitor-muted rounded-[14px] border border-dashed border-line-strong/80 px-6 py-16 text-center">
            <p className="visitor-copy text-[length:var(--vt-small)] font-medium text-muted">{language === "en" ? "No English notes have been published yet." : "Henüz Türkçe not yayınlanmadı."}</p>
            <p className="visitor-muted mt-2 text-[length:var(--vt-ui)] text-muted">{language === "en" ? "New notes land here through the day." : "Yeni notlar gün boyunca buraya düşer."}</p>
          </div>
        )}
        </div>

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
      </main>
    </VisitorShell>
  );
}
