import Image from "next/image";
import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import { Fragment } from "react";
import { ArrowUpRight } from "lucide-react";
import { DailyBrief } from "@/components/features/visitor/daily-brief";
import { AutoLoadMore } from "@/components/features/visitor/auto-load-more";
import { NewsletterPanel } from "@/components/features/visitor/newsletter-panel";
import { LiveNewsBand } from "@/components/features/visitor/live-news-band";
import { NoteCard } from "@/components/features/visitor/note-card";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";
import { dailyBriefPosts, dailyBriefText } from "@/lib/daily-brief";
import { isOptimizableImage } from "@/lib/images";
import { absoluteUrl, jsonLd, postHeadline, siteUrl } from "@/lib/seo";
import { dateKey, fullDateLabel, relativeDayLabel, timeLabel } from "@/lib/visitor-date";
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
      types: { "application/rss+xml": [{ url: languageHref("/rss.xml", language), title: settings.siteName }] },
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
      className="visitor-panel group block overflow-hidden rounded-panel border border-line-strong bg-surface shadow-[0_6px_24px_rgba(0,0,0,.04)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_12px_34px_rgba(0,0,0,.09)]"
    >
      <div className={ad.image_url ? "grid sm:grid-cols-[minmax(0,1fr)_220px]" : "block"}>
        <div className="flex min-w-0 flex-col p-5 sm:min-h-[220px] sm:p-6">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="visitor-muted text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.16em] text-faint">{ad.label}</span>
          </div>
          <h2 className="visitor-heading mt-4 text-[length:var(--vt-h3)] font-bold leading-[1.08] tracking-[-.04em] [text-wrap:balance]">{ad.title}</h2>
          <p className="visitor-copy mt-2 max-w-[480px] text-[length:var(--vt-small)] font-medium leading-relaxed text-muted [text-wrap:pretty]">{ad.description}</p>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4 sm:mt-auto">
            <span className="text-[length:var(--vt-ui)] font-bold text-ink">{ad.cta_label}</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-surface-2 text-ink transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-ink-contrast" aria-hidden="true">
              <ArrowUpRight size={17} strokeWidth={2.2} />
            </span>
          </div>
        </div>
        {ad.image_url && (
          <div className="relative order-first min-h-44 overflow-hidden border-b border-line bg-surface-2 sm:order-last sm:min-h-full sm:border-b-0 sm:border-l">
            {isOptimizableImage(ad.image_url)
              ? <Image src={ad.image_url} alt="" fill sizes="(max-width: 639px) 100vw, 220px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
              // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
              : <img src={ad.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />}
          </div>
        )}
      </div>
    </a>
  );
}

/** How far back the feed query reaches for the brief: comfortably more than one busy day of notes. */
const briefLookback = 60;

/**
 * Ads only enter the feed once the reader is past this many notes, so the first screens stay clean.
 * The last note is still kept ad-free, hence the `- 1`.
 */
const adsAfterPostCount = 20;

function randomAdSlots(postCount: number, ads: Advertisement[], excludedSlots: number[] = []) {
  const slots = new Map<number, Advertisement>();
  if (postCount < adsAfterPostCount + 2 || !ads.length) return slots;
  const excluded = new Set(excludedSlots);
  const candidates = Array.from({ length: postCount - 1 - adsAfterPostCount }, (_, index) => index + adsAfterPostCount).filter((index) => !excluded.has(index));
  if (!candidates.length) return slots;
  for (let index = candidates.length - 1; index > 0; index--) { const swap = randomInt(index + 1); [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]]; }
  const shuffledAds = [...ads];
  for (let index = shuffledAds.length - 1; index > 0; index--) { const swap = randomInt(index + 1); [shuffledAds[index], shuffledAds[swap]] = [shuffledAds[swap], shuffledAds[index]]; }
  const count = Math.min(shuffledAds.length, Math.max(1, Math.floor((postCount - adsAfterPostCount) / 3)), candidates.length);
  for (let index = 0; index < count; index++) slots.set(candidates[index], shuffledAds[index]);
  return slots;
}

/**
 * The feed is read a day at a time, so it is rendered a day at a time: each day is its own section
 * with its own heading, which is what lets that heading stay pinned while the day scrolls past.
 *
 * The flat feed position travels with every note, because the ad and newsletter slots were drawn
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
  /*
   * The brief covers a whole day of notes, which is normally more than the first page of the feed
   * shows, so the query reaches back far enough to hold one. The feed still renders only its own
   * slice; the rest of the rows exist for the paragraph at the top.
   */
  const fetchCount = Math.min(Math.max(visiblePostCount + 1, briefLookback), 500);
  const [postData, ads] = await Promise.all([getPosts(1, fetchCount, language), settings.moduleAds ? getActiveAds(language) : Promise.resolve([])]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
  const briefPosts = dailyBriefPosts(posts);
  const briefText = dailyBriefText(briefPosts, language);
  // The "still unfolding" note only belongs on a day that is actually still running: early in the
  // morning the brief falls back to yesterday, and yesterday is finished.
  const briefIsToday = Boolean(briefPosts.length) && dateKey(briefPosts[0].published_at ?? briefPosts[0].created_at) === dateKey(new Date().toISOString());
  const newsletterSlot = settings.moduleNewsletter && settings.newsletterEnabled ? Math.min(3, posts.length - 1) : -1;
  const adSlots = randomAdSlots(posts.length, ads, newsletterSlot >= 0 ? [newsletterSlot] : []);
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
    <VisitorShell language={language} siteName={settings.siteName} topContent={<LiveNewsBand posts={posts} language={language} />}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      {/*
        The brief carries the page's `h1`. On a day with nothing published it renders nothing at all,
        so the heading falls back to a hidden one — a page still has to name itself for screen
        readers and search engines.
      */}
      {briefText ? null : <h1 className="sr-only">{settings.siteName}</h1>}

      <DailyBrief
        text={briefText}
        sentenceCount={briefPosts.length}
        language={language}
        latestTime={briefIsToday ? timeLabel(briefPosts[0].published_at ?? briefPosts[0].created_at, language) : undefined}
      />

      <main className={`flex w-full max-w-[720px] flex-col ${briefText ? "mt-2 sm:mt-3" : "mt-14 sm:mt-16"}`}>
        {/*
          The rail, the dots and the timestamp gutter all live outside the 720px column and are
          desktop-only — see `.visitor-timeline`. On a phone that gutter used to eat 32px of the
          card's left edge while the right edge stayed on the container padding, which left every
          note visibly off-centre; below `sm` the timestamp sits inline above its card instead.
        */}
        <div className="visitor-timeline">
        {posts.length ? groupPostsByDay(posts).map((day, dayIndex) => (
          <section key={day.key} aria-label={fullDateLabel(day.publishedAt, language)} className={dayIndex ? "mt-9 sm:mt-11" : ""}>
            {/*
              The day heading stays with its own notes: it is pinned to the top of the viewport for
              as long as that day is on screen, so a reader scrolling through a long day never loses
              track of which one they are in.

              The band is fully opaque and reaches out over the timestamp gutter: a translucent,
              blurred one read as though the heading had not stuck — notes stayed visible through
              it — and re-filtering the ambient layer behind it on every scroll frame made it
              shimmer. It only ever overhangs to the left, which is what keeps it from needing a
              clipping ancestor; see `.visitor-ambient-frame`.
            */}
            <div className="sticky top-0 z-20 -mx-1 bg-canvas px-1 py-3 sm:-ml-[124px] sm:pl-[124px]">
              <div className="flex items-center gap-3">
                <span
                  title={fullDateLabel(day.publishedAt, language)}
                  className="shrink-0 rounded-full border border-line-strong bg-canvas px-3 py-1.5 text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.13em] text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.03)]"
                >
                  {relativeDayLabel(day.publishedAt, language)}
                </span>
                <span className="h-px min-w-6 flex-1 bg-line-strong" aria-hidden="true" />
                {/* The wordmark rides along with the pinned band so the page keeps signing itself
                    once the header has scrolled away. Decorative only — the nav already names the
                    site, and a screen reader should not meet it again on every day heading. */}
                <span aria-hidden="true" className="visitor-heading shrink-0 text-[length:var(--vt-meta)] font-bold tracking-[-.045em] text-faint">
                  {settings.siteName}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-1 sm:gap-5">
              {day.items.map(({ post, position }) => {
                const publishedAt = post.published_at ?? post.created_at;
                return (
                  <Fragment key={post.id}>
                    {/* The gutter belongs only to the note. Ads and newsletter panels are separate
                        feed items and must not light up this note's time or timeline dot. */}
                    <div className="group/note relative">
                      <time
                        dateTime={publishedAt}
                        title={fullDateLabel(publishedAt, language)}
                        className="visitor-muted mb-2 inline-flex font-mono text-[length:var(--vt-meta)] font-semibold tabular-nums tracking-[.06em] text-faint transition-colors duration-300 group-hover/note:text-ink-2 sm:absolute sm:-left-[104px] sm:top-5 sm:mb-0 sm:w-16 sm:justify-end"
                      >
                        {timeLabel(publishedAt, language)}
                      </time>
                      <span
                        className="absolute -left-7 top-[23px] z-10 hidden size-[11px] rounded-full border-[3px] border-canvas bg-ink shadow-[0_0_0_1px_var(--color-line-strong)] transition-transform duration-300 ease-out group-hover/note:scale-125 sm:block"
                        aria-hidden="true"
                      />
                      <NoteCard post={post} layout={settings.feedLayout} language={language} />
                    </div>
                    {adSlots.has(position) && <div className="py-1"><AdCard ad={adSlots.get(position)!} /></div>}
                    {settings.moduleNewsletter && settings.newsletterEnabled && position === newsletterSlot && (
                      <NewsletterPanel title={language === "en" ? settings.newsletterTitleEn : settings.newsletterTitle} description={language === "en" ? settings.newsletterDescriptionEn : settings.newsletterDescription} language={language} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </section>
        )) : (
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
                <div className="flex justify-center pb-10">
                  <a href={nextHref} className="flex h-14 items-center rounded-full bg-ink px-6 text-[length:var(--vt-small)] font-semibold text-ink-contrast">
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
