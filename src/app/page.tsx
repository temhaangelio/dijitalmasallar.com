import Image from "next/image";
import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import { DailyBrief } from "@/components/features/visitor/daily-brief";
import { LoadMoreButton } from "@/components/features/visitor/load-more-button";
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
import { dateKey, dateLabel, timeLabel } from "@/lib/visitor-date";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";

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
    <a href={ad.target_url} target="_blank" rel="sponsored noopener noreferrer" className="group overflow-hidden rounded-panel bg-ink text-ink-contrast transition-transform hover:-translate-y-0.5">
      {ad.image_url && (
        <div className="relative h-52 bg-surface-3 sm:h-64">
          {isOptimizableImage(ad.image_url)
            ? <Image src={ad.image_url} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
            // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
            : <img src={ad.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
        </div>
      )}
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><span className="text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.16em] text-on-dark">{ad.label}</span><h2 className="mt-2 text-[length:var(--vt-h3)] font-bold tracking-[-.04em]">{ad.title}</h2><p className="mt-2 max-w-[520px] text-[length:var(--vt-small)] font-medium leading-relaxed text-on-dark [text-wrap:pretty]">{ad.description}</p></div>
        <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-ink-contrast px-5 text-[length:var(--vt-ui)] font-bold text-ink">{ad.cta_label} ↗</span>
      </div>
    </a>
  );
}

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

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string; limit?: string }> }) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const language = resolveVisitorLanguage(params.lang);
  const requestedLimit = Number.parseInt(params.limit ?? "", 10);
  const visiblePostCount = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, settings.postsPerPage), 500) : settings.postsPerPage;
  if (settings.maintenanceMode) return <main className="visitor-page grid min-h-screen place-items-center bg-canvas px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-field bg-ink" /><h1 className="text-[length:var(--vt-h1)] font-bold tracking-[-.05em]">{settings.siteName}</h1><p className="mt-3 text-[length:var(--vt-small)] text-muted">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  const [postData, ads] = await Promise.all([getPosts(1, Math.min(visiblePostCount + 1, 500), language), settings.moduleAds ? getActiveAds(language) : Promise.resolve([])]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
  const briefPosts = dailyBriefPosts(posts);
  const briefText = dailyBriefText(briefPosts, language);
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

      <DailyBrief text={briefText} sentenceCount={briefPosts.length} language={language} />

      <main className={`flex w-full max-w-[720px] flex-col ${briefText ? "mt-2 sm:mt-3" : "mt-14 sm:mt-16"}`}>
        {/*
          The rail, the dots and the timestamp gutter all live outside the 720px column and are
          desktop-only — see `.visitor-timeline`. On a phone that gutter used to eat 32px of the
          card's left edge while the right edge stayed on the container padding, which left every
          note visibly off-centre; below `sm` the timestamp sits inline above its card instead.
        */}
        <div className="visitor-timeline">
        {posts.length ? posts.map((post, index) => {
          const publishedAt = post.published_at ?? post.created_at;
          const startsNewDay = index === 0 || dateKey(publishedAt) !== dateKey(posts[index - 1].published_at ?? posts[index - 1].created_at);
          return (
          <div className="pb-4 sm:pb-5" key={post.id}>
            {startsNewDay && (
              <div className={`visitor-muted mb-4 flex items-center gap-3 sm:mb-5 ${index === 0 ? "pt-1" : "pt-7 sm:pt-8"}`}>
                <span className="shrink-0 rounded-full border border-line-strong bg-canvas px-3 py-1.5 text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.13em] text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.03)]">{dateLabel(publishedAt, language)}</span>
                <span className="h-px min-w-6 flex-1 bg-line-strong" aria-hidden="true" />
              </div>
            )}
            <div className="relative">
              <time dateTime={publishedAt} title={dateLabel(publishedAt, language)} className="visitor-muted mb-2 inline-flex font-mono text-[length:var(--vt-meta)] font-semibold tabular-nums tracking-[.06em] text-faint sm:absolute sm:-left-[104px] sm:top-5 sm:mb-0 sm:w-16 sm:justify-end">{timeLabel(publishedAt, language)}</time>
              <span className="absolute -left-7 top-[23px] z-10 hidden size-[11px] rounded-full border-[3px] border-canvas bg-ink shadow-[0_0_0_1px_var(--color-line-strong)] sm:block" aria-hidden="true" />
              <NoteCard post={post} layout={settings.feedLayout} language={language} />
              {adSlots.has(index) && <div className="mt-3"><AdCard ad={adSlots.get(index)!} /></div>}
              {settings.moduleNewsletter && settings.newsletterEnabled && index === newsletterSlot && (
                <div className="mt-3"><NewsletterPanel title={language === "en" ? settings.newsletterTitleEn : settings.newsletterTitle} description={language === "en" ? settings.newsletterDescriptionEn : settings.newsletterDescription} language={language} /></div>
              )}
            </div>
          </div>
          );
        }) : <div className="visitor-panel visitor-muted rounded-panel border border-line bg-surface px-6 py-14 text-center text-[length:var(--vt-small)] text-muted">{language === "en" ? "No English posts have been published yet." : "Henüz Türkçe yazı yayınlanmadı."}</div>}
        </div>

        {hasMorePosts && <div className="flex justify-center pt-6">
          <LoadMoreButton
            href={languageHref("/", language, { limit: Math.min(visiblePostCount + settings.postsPerPage, 500) })}
            label={language === "en" ? "More notes" : "Daha fazla not"}
          />
        </div>}
      </main>
    </VisitorShell>
  );
}
