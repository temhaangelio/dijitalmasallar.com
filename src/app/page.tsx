import Image from "next/image";
import Link from "next/link";
import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import { LoadMoreButton } from "@/components/features/visitor/load-more-button";
import { NewsletterPanel } from "@/components/features/visitor/newsletter-panel";
import { VisitorAboutLink, VisitorFooter, VisitorShell } from "@/components/layout/visitor-shell";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getPosts } from "@/services/posts";
import { getSiteSettings, type SiteSettings } from "@/services/settings";
import { isOptimizableImage } from "@/lib/images";
import { getVisitorLanguage, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  // `absolute` stops the root layout template from appending a second brand name.
  return { title: { absolute: settings.siteName }, description: settings.description };
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

function relativeTime(value: string, language: VisitorLanguage) {
  const elapsed = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(elapsed / 3_600_000));
  if (hours < 24) return language === "en" ? `${hours}h ago` : `${hours} saat önce`;
  return language === "en" ? `${Math.floor(hours / 24)}d ago` : `${Math.floor(hours / 24)} gün önce`;
}

function dateLabel(value: string, language: VisitorLanguage) {
  const locale = language === "en" ? "en-US" : "tr-TR";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "Europe/Istanbul" })
    .format(new Date(value))
    .toLocaleUpperCase(locale);
}

function NoteCard({ post, layout, language }: { post: Post; layout: SiteSettings["feedLayout"]; language: VisitorLanguage }) {
  const layoutClass = layout === "classic" ? "rounded-none border-b border-line-strong bg-transparent px-2 py-7" : layout === "card" ? "rounded-panel border border-line bg-surface p-6 shadow-card" : "rounded-panel bg-surface p-6";
  return (
    <article className={`visitor-card group flex flex-col gap-3.5 transition-colors hover:bg-surface-2 ${layoutClass}`}>
      <time dateTime={post.published_at ?? post.created_at} className="visitor-muted text-[13px] font-medium text-muted">{relativeTime(post.published_at ?? post.created_at, language)}</time>
      <Link href={`/haber/${post.id}?lang=${post.language === "en" ? "en" : "tr"}`} className="visitor-copy m-0 text-[19px] font-normal leading-[1.6] text-ink [text-wrap:pretty] hover:opacity-70">{feedContent(post)}</Link>
      <div className="text-[13px] font-medium">
        {post.source_url ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source font-semibold tracking-[.04em] text-ink hover:underline">{post.source_name || (language === "en" ? "Source" : "Kaynak")}</a> : <span className="visitor-source font-semibold tracking-[.04em] text-ink">{post.source_name || (language === "en" ? "Source" : "Kaynak")}</span>}
      </div>
    </article>
  );
}

function AdCard({ ad, priority = false }: { ad: Advertisement; priority?: boolean }) {
  return (
    <a href={ad.target_url} target="_blank" rel="sponsored noopener noreferrer" className="group overflow-hidden rounded-panel bg-ink text-ink-contrast transition-transform hover:-translate-y-0.5">
      {ad.image_url && (
        <div className="relative h-52 bg-surface-3 sm:h-64">
          {isOptimizableImage(ad.image_url)
            ? <Image src={ad.image_url} alt="" fill priority={priority} sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
            // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
            : <img src={ad.image_url} alt="" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className="absolute inset-0 size-full object-cover" />}
        </div>
      )}
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><span className="text-[11px] font-bold tracking-[.16em] text-on-dark">{ad.label}</span><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">{ad.title}</h2><p className="mt-2 max-w-[520px] text-sm font-medium leading-relaxed text-on-dark">{ad.description}</p></div>
        <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-ink-contrast px-5 text-sm font-bold text-ink">{ad.cta_label} ↗</span>
      </div>
    </a>
  );
}

function randomAdSlots(postCount: number, ads: Advertisement[], excludedSlots: number[] = []) {
  const slots = new Map<number, Advertisement>();
  if (postCount < 3 || !ads.length) return slots;
  const excluded = new Set(excludedSlots);
  const candidates = Array.from({ length: postCount - 2 }, (_, index) => index + 1).filter((index) => !excluded.has(index));
  for (let index = candidates.length - 1; index > 0; index--) { const swap = randomInt(index + 1); [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]]; }
  const shuffledAds = [...ads];
  for (let index = shuffledAds.length - 1; index > 0; index--) { const swap = randomInt(index + 1); [shuffledAds[index], shuffledAds[swap]] = [shuffledAds[swap], shuffledAds[index]]; }
  const count = Math.min(shuffledAds.length, Math.max(1, Math.floor(postCount / 3)), candidates.length);
  for (let index = 0; index < count; index++) slots.set(candidates[index], shuffledAds[index]);
  return slots;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string; limit?: string }> }) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const language = await getVisitorLanguage(params.lang);
  const requestedLimit = Number.parseInt(params.limit ?? "", 10);
  const visiblePostCount = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, settings.postsPerPage), 500) : settings.postsPerPage;
  if (settings.maintenanceMode) return <main className="grid min-h-screen place-items-center bg-canvas px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-field bg-ink" /><h1 className="text-4xl font-bold tracking-[-.05em]">{settings.siteName}</h1><p className="mt-3 text-muted">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  const [postData, ads] = await Promise.all([getPosts(1, Math.min(visiblePostCount + 1, 500), language), settings.moduleAds ? getActiveAds(language) : Promise.resolve([])]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
  const newsletterSlot = settings.moduleNewsletter && settings.newsletterEnabled ? Math.min(3, posts.length - 1) : -1;
  const adSlots = randomAdSlots(posts.length, ads, newsletterSlot >= 0 ? [newsletterSlot] : []);

  return (
    <VisitorShell language={language} siteName={settings.siteName} action={<VisitorAboutLink language={language} />}>

      <header id="hakkinda" className="flex w-full max-w-[720px] flex-col items-center gap-[18px] px-2 pb-10 pt-14 text-center">
        <h1 className="visitor-heading m-0 max-w-[560px] text-[24px] font-semibold leading-snug tracking-[-.03em] [text-wrap:pretty]">{language === "en" ? settings.descriptionEn : settings.description}</h1>
      </header>

      <main className="flex w-full max-w-[720px] flex-col gap-3">
        {posts.length ? posts.map((post, index) => (
          <div className="contents" key={post.id}>
            {(index === 3 || index === 5) && <div className="visitor-muted px-2 pb-2 pt-5 text-xs font-semibold tracking-[.16em] text-muted">{dateLabel(post.published_at ?? post.created_at, language)}</div>}
            <NoteCard post={post} layout={settings.feedLayout} language={language} />
            {/* An ad can land as early as the second card, where it becomes the LCP element. */}
            {adSlots.has(index) && <AdCard ad={adSlots.get(index)!} priority={index <= 2} />}
            {settings.moduleNewsletter && settings.newsletterEnabled && index === newsletterSlot && (
              <NewsletterPanel title={settings.newsletterTitle} description={settings.newsletterDescription} />
            )}
          </div>
        )) : <div className="visitor-panel visitor-muted rounded-panel bg-surface px-6 py-12 text-center text-muted">{language === "en" ? "No English posts have been published yet." : "Henüz Türkçe yazı yayınlanmadı."}</div>}

        {hasMorePosts && <div className="flex justify-center pb-2 pt-6">
          <LoadMoreButton
            href={`/?lang=${language}&limit=${Math.min(visiblePostCount + settings.postsPerPage, 500)}`}
            label={language === "en" ? "More notes" : "Daha fazla not"}
          />
        </div>}

        <VisitorFooter language={language} siteName={settings.siteName} />
      </main>
    </VisitorShell>
  );
}
