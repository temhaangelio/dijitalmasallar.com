import Image from "next/image";
import Link from "next/link";
import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import { LoadMoreButton } from "@/components/features/visitor/load-more-button";
import { NewsletterPanel } from "@/components/features/visitor/newsletter-panel";
import { LiveNewsBand } from "@/components/features/visitor/live-news-band";
import { VisitorFooter, VisitorShell } from "@/components/layout/visitor-shell";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getPosts } from "@/services/posts";
import { getSiteSettings, type SiteSettings } from "@/services/settings";
import { isOptimizableImage } from "@/lib/images";
import { sourceLabel } from "@/lib/source-label";
import { absoluteUrl, jsonLd, postHeadline, siteUrl } from "@/lib/seo";
import { languageHref, resolveVisitorLanguage, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";
import type { ReactNode } from "react";

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

function feedContent(post: Post): ReactNode[] {
  const withoutHeading = post.body.replace(/^#\s+[^\n]+\n+/i, "");
  const content = withoutHeading
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim() || post.excerpt;
  const nodes: ReactNode[] = [];
  const pattern = /~~([^~]+)~~|==([^=]+)==/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > cursor) nodes.push(content.slice(cursor, match.index));
    if (match[1]) nodes.push(<del key={`strike-${match.index}`}>{match[1]}</del>);
    else nodes.push(<mark key={`highlight-${match.index}`} className="visitor-highlight rounded-[3px] px-0.5 text-inherit">{match[2]}</mark>);
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) nodes.push(content.slice(cursor));
  return nodes.length ? nodes : [content];
}

function timeLabel(value: string, language: VisitorLanguage) {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function dateLabel(value: string, language: VisitorLanguage) {
  const locale = language === "en" ? "en-US" : "tr-TR";
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date(value));
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(value));
}

function NoteCard({ post, layout, language }: { post: Post; layout: SiteSettings["feedLayout"]; language: VisitorLanguage }) {
  const layoutClass = layout === "card" ? "border border-line shadow-card" : layout === "classic" ? "border border-line-strong" : "border border-transparent";
  const displayedSource = sourceLabel(post.source_name, post.source_url, language === "en" ? "Source" : "Kaynak");
  return (
    <article className={`visitor-card group rounded-panel bg-surface p-5 transition duration-300 hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-soft sm:p-6 ${layoutClass}`}>
      <Link href={languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en")} className="visitor-copy block text-[19px] font-normal leading-[1.65] text-ink [text-wrap:pretty] transition-opacity hover:opacity-65">{feedContent(post)}</Link>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[12px] font-semibold">
        {post.source_url ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source font-normal tracking-[.04em] text-ink transition-opacity hover:opacity-60">{displayedSource}</a> : <span className="visitor-source font-normal tracking-[.04em] text-muted">{displayedSource}</span>}
        <span className="text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </div>
    </article>
  );
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
        <div className="min-w-0"><span className="text-[11px] font-bold tracking-[.16em] text-on-dark">{ad.label}</span><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">{ad.title}</h2><p className="mt-2 max-w-[520px] text-sm font-medium leading-relaxed text-on-dark">{ad.description}</p></div>
        <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-ink-contrast px-5 text-sm font-bold text-ink">{ad.cta_label} ↗</span>
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
  if (settings.maintenanceMode) return <main className="grid min-h-screen place-items-center bg-canvas px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-field bg-ink" /><h1 className="text-4xl font-bold tracking-[-.05em]">{settings.siteName}</h1><p className="mt-3 text-muted">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  const [postData, ads] = await Promise.all([getPosts(1, Math.min(visiblePostCount + 1, 500), language), settings.moduleAds ? getActiveAds(language) : Promise.resolve([])]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
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

      <header className="flex w-full max-w-[720px] flex-col items-center px-4 pb-16 pt-16 text-center sm:pb-20 sm:pt-20">
        <h1 className="visitor-heading m-0 max-w-[600px] text-[30px] font-semibold leading-[1.3] tracking-[-.04em] [text-wrap:balance] sm:text-[36px] sm:leading-[1.28]">{language === "en" ? settings.descriptionEn : settings.description}</h1>
      </header>

      <main className="flex w-full max-w-[720px] flex-col">
        <div className="relative before:absolute before:bottom-5 before:left-[11px] before:top-2 before:w-px before:bg-line-strong sm:before:-left-[23px]">
        {posts.length ? posts.map((post, index) => {
          const publishedAt = post.published_at ?? post.created_at;
          const startsNewDay = index === 0 || dateKey(publishedAt) !== dateKey(posts[index - 1].published_at ?? posts[index - 1].created_at);
          return (
          <div className="pb-5" key={post.id}>
            {startsNewDay && (
              <div className={`visitor-muted mb-5 flex items-center gap-3 pl-8 sm:pl-0 ${index === 0 ? "pt-1" : "pt-7"}`}>
                <span className="shrink-0 rounded-full border border-line-strong bg-canvas px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.03)]">{dateLabel(publishedAt, language)}</span>
                <span className="h-px min-w-6 flex-1 bg-line-strong" aria-hidden="true" />
              </div>
            )}
            <div className="relative pl-8 sm:pl-0">
              <time dateTime={publishedAt} title={dateLabel(publishedAt, language)} className="visitor-muted relative z-10 mb-2 inline-flex bg-canvas font-mono text-[12px] font-semibold tabular-nums tracking-[.06em] text-muted sm:absolute sm:-left-[104px] sm:top-5 sm:mb-0 sm:w-[64px] sm:justify-end">{timeLabel(publishedAt, language)}</time>
              <span className="absolute left-[6px] top-[3px] z-10 size-[11px] rounded-full border-[3px] border-canvas bg-ink shadow-[0_0_0_1px_var(--color-line-strong)] sm:-left-7 sm:top-[23px]" aria-hidden="true" />
              <NoteCard post={post} layout={settings.feedLayout} language={language} />
              {adSlots.has(index) && <div className="mt-3"><AdCard ad={adSlots.get(index)!} /></div>}
              {settings.moduleNewsletter && settings.newsletterEnabled && index === newsletterSlot && (
                <div className="mt-3"><NewsletterPanel title={language === "en" ? settings.newsletterTitleEn : settings.newsletterTitle} description={language === "en" ? settings.newsletterDescriptionEn : settings.newsletterDescription} language={language} /></div>
              )}
            </div>
          </div>
          );
        }) : <div className="visitor-panel visitor-muted rounded-panel bg-surface px-6 py-12 text-center text-muted">{language === "en" ? "No English posts have been published yet." : "Henüz Türkçe yazı yayınlanmadı."}</div>}
        </div>

        {hasMorePosts && <div className="flex justify-center pb-2 pt-6">
          <LoadMoreButton
            href={languageHref("/", language, { limit: Math.min(visiblePostCount + settings.postsPerPage, 500) })}
            label={language === "en" ? "More notes" : "Daha fazla not"}
          />
        </div>}

        <VisitorFooter language={language} siteName={settings.siteName} />
      </main>
    </VisitorShell>
  );
}
