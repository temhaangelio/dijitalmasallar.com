import Image from "next/image";
import type { Metadata } from "next";
import { Fragment } from "react";
import { AutoLoadMore } from "@/components/features/visitor/auto-load-more";
import { DailyBrief } from "@/components/features/visitor/daily-brief";
import { NoteCard } from "@/components/features/visitor/note-card";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";
import { isOptimizableImage } from "@/lib/images";
import { absoluteUrl, jsonLd, postHeadline, siteUrl } from "@/lib/seo";
import { dateKey, dateLabel, fullDateLabel, timeLabel } from "@/lib/visitor-date";
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
      languages: { en: "/", tr: "/?lang=tr", "x-default": "/" },
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

function AdCard({ ad }: { ad: Advertisement }) {
  return (
    <a
      href={ad.target_url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label={`${ad.label}: ${ad.title}`}
      className="visitor-card group block overflow-hidden rounded-[14px] border border-line/70 bg-surface-2/35 shadow-[0_1px_2px_rgba(0,0,0,.018)] transition-colors hover:border-line-strong"
    >
      {ad.image_url ? (
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-surface-3">
          {isOptimizableImage(ad.image_url)
            ? <Image src={ad.image_url} alt="" fill sizes="(max-width: 767px) 100vw, 640px" className="object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
            // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
            : <img src={ad.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />}
        </div>
      ) : null}

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[.18em] text-accent">{ad.label}</span>
        <h2 className="visitor-serif mt-3 text-[20px] font-semibold leading-[1.28] tracking-[-.02em] text-ink transition-colors group-hover:text-accent sm:text-[23px]">{ad.title}</h2>
        <p className="visitor-copy mt-2.5 text-[15px] font-normal leading-[1.6] text-muted [text-wrap:pretty] sm:text-[16px]">{ad.description}</p>
        <div className="mt-4 flex justify-end">
          <span className="visitor-source border-b border-line pb-0.5 font-mono text-[11px] font-normal leading-[1.6] text-muted transition-colors group-hover:border-accent group-hover:text-accent">{ad.cta_label} ↗</span>
        </div>
      </div>
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
  const requestedLimit = Number.parseInt(params.limit ?? "", 10);
  const visiblePostCount = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, settings.postsPerPage), 500) : settings.postsPerPage;
  if (settings.maintenanceMode) return <main className="visitor-page grid min-h-screen place-items-center bg-canvas px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-field bg-ink" /><h1 className="text-[length:var(--vt-h1)] font-bold tracking-[-.05em]">{settings.siteName}</h1><p className="mt-3 text-[length:var(--vt-small)] text-muted">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  // One extra row is enough to decide whether the automatic "more notes" control is needed.
  const fetchCount = Math.min(visiblePostCount + 1, 500);
  const [postData, ads] = await Promise.all([getPosts(1, fetchCount, language), settings.moduleAds ? getActiveAds(language) : Promise.resolve([])]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
  const postDays = groupPostsByDay(posts);
  const todaysPosts = postDays[0]?.key === dateKey(new Date().toISOString())
    ? postDays[0].items.map(({ post }) => post)
    : [];
  const showDailyBrief = todaysPosts.length >= 4;
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
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: settings.siteName,
        url: homeUrl,
        inLanguage: language,
        publisher: { "@id": `${baseUrl}/#organization` },
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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[25] h-[calc(env(safe-area-inset-top)+36px)] bg-canvas sm:hidden" aria-hidden="true" />

      <main className="mt-9 flex w-full max-w-[640px] flex-col sm:mt-14">
        <div>
        {posts.length ? (
          <>
          {postDays.map((day, dayIndex) => (
          <section key={day.key} aria-label={fullDateLabel(day.publishedAt, language)} className={dayIndex ? "mt-16" : ""}>
            {/*
              The heading remains pinned while its day's notes are in view; the next section's
              heading naturally pushes it away.
            */}
            <div className="sticky top-[env(safe-area-inset-top)] z-30 -mt-3 bg-canvas py-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <span
                  title={fullDateLabel(day.publishedAt, language)}
                  className="shrink-0 font-mono text-[10px] font-medium leading-none uppercase tracking-[.2em] text-accent sm:text-[11px]"
                >
                  {dateLabel(day.publishedAt, language)}
                </span>
                <span className="h-px min-w-6 flex-1 bg-line-strong" aria-hidden="true" />
              </div>
            </div>

            {dayIndex === 0 && showDailyBrief ? <div className="mt-[34px]"><DailyBrief posts={todaysPosts} language={language} /></div> : null}

            <div className={`${dayIndex === 0 && showDailyBrief ? "" : "mt-[34px]"} flex flex-col gap-8 sm:gap-[46px]`}>
              {day.items.map(({ post, position }) => {
                const publishedAt = post.published_at ?? post.created_at;
                return (
                  <Fragment key={post.id}>
                    <div className="group/note relative">
                      <time
                        dateTime={publishedAt}
                        title={fullDateLabel(publishedAt, language)}
                        className="visitor-muted mb-2.5 inline-flex items-center font-mono text-[11px] font-medium leading-none tabular-nums text-accent sm:mb-3 sm:text-[12px]"
                      >
                        {timeLabel(publishedAt, language)}
                        {position === 0 ? <span className="ml-2 size-1.5 shrink-0 animate-pulse rounded-full bg-accent" aria-hidden="true" /> : null}
                      </time>
                      <NoteCard post={post} language={language} />
                    </div>
                    {adSlots.has(position) && <AdCard ad={adSlots.get(position)!} />}
                  </Fragment>
                );
              })}
            </div>
          </section>
          ))}
          </>
        ) : (
          <div className="visitor-panel visitor-muted rounded-panel border border-dashed border-line-strong px-6 py-16 text-center">
            <p className="visitor-copy text-[length:var(--vt-small)] font-medium text-muted">{language === "en" ? "No English notes have been published yet." : "Henüz Türkçe not yayınlanmadı."}</p>
            <p className="visitor-muted mt-2 text-[length:var(--vt-ui)] text-faint">{language === "en" ? "New notes land here through the day." : "Yeni notlar gün boyunca buraya düşer."}</p>
          </div>
        )}
        </div>

        {hasMorePosts && (() => {
          const nextHref = languageHref("/", language, { limit: Math.min(visiblePostCount + settings.postsPerPage, 500) });
          const label = language === "en" ? "Loading more notes" : "Yeni notlar yükleniyor";
          return (
            <>
              <AutoLoadMore href={nextHref} label={label} />
              {/* Without scripting there is no observer to fire, so the feed keeps a plain link. */}
              <noscript>
                <div className="flex justify-center py-14">
                  <a href={nextHref} className="border-b border-ink pb-1.5 font-mono text-[11px] font-medium uppercase tracking-[.18em] text-ink hover:border-accent hover:text-accent">
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
