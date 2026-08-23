import Link from "next/link";
import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import { SubscribeForm } from "@/components/forms/subscribe-form";
import { LoadMoreButton } from "@/components/features/visitor/load-more-button";
import { getActiveAds, type Advertisement } from "@/services/ads";
import { getPosts } from "@/services/posts";
import { getSiteSettings, type SiteSettings } from "@/services/settings";
import { getVisitorLanguage, type VisitorLanguage } from "@/lib/visitor-language";
import { getPublishedPages, localizedPage } from "@/services/pages";
import type { Post } from "@/types/database";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: settings.siteName, description: settings.description };
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
  const layoutClass = layout === "classic" ? "rounded-none border-b border-[#dedede] bg-transparent px-2 py-7" : layout === "card" ? "rounded-[24px] border border-[#e7e7e7] bg-white p-6 shadow-sm" : "rounded-[24px] bg-white p-6";
  return (
    <article className={`visitor-card group flex flex-col gap-3.5 transition-colors hover:bg-[#fbfbfb] ${layoutClass}`}>
      <time dateTime={post.published_at ?? post.created_at} className="visitor-muted text-[13px] font-medium text-[#a1a1a1]">{relativeTime(post.published_at ?? post.created_at, language)}</time>
      <Link href={`/haber/${post.id}?lang=${post.language === "en" ? "en" : "tr"}`} className="visitor-copy m-0 text-[19px] font-normal leading-[1.6] text-[#1a1a1a] [text-wrap:pretty] hover:opacity-70">{feedContent(post)}</Link>
      <div className="text-[13px] font-medium">
        {post.source_url ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source font-semibold tracking-[.04em] text-[#0a0a0a] hover:underline">{post.source_name || (language === "en" ? "Source" : "Kaynak")}</a> : <span className="visitor-source font-semibold tracking-[.04em] text-[#0a0a0a]">{post.source_name || (language === "en" ? "Source" : "Kaynak")}</span>}
      </div>
    </article>
  );
}

function AdCard({ ad }: { ad: Advertisement }) {
  return (
    <a href={ad.target_url} target="_blank" rel="sponsored noopener noreferrer" className="group overflow-hidden rounded-[24px] bg-[#0a0a0a] text-white transition-transform hover:-translate-y-0.5">
      {ad.image_url && <div className="h-52 bg-[#202020] bg-cover bg-center sm:h-64" style={{ backgroundImage: `url(${JSON.stringify(ad.image_url)})` }} />}
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><span className="text-[11px] font-bold tracking-[.16em] text-[#a1a1a1]">{ad.label}</span><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">{ad.title}</h2><p className="mt-2 max-w-[520px] text-sm font-medium leading-relaxed text-[#bdbdbd]">{ad.description}</p></div>
        <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#0a0a0a]">{ad.cta_label} ↗</span>
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
  if (settings.maintenanceMode) return <main className="grid min-h-screen place-items-center bg-[#efefef] px-5 text-center"><div><div className="mx-auto mb-6 size-12 rounded-2xl bg-black" /><h1 className="text-4xl font-bold tracking-[-.05em]">{settings.siteName}</h1><p className="mt-3 text-[#777]">Kısa bir bakım çalışması yapıyoruz. Birazdan tekrar buradayız.</p></div></main>;
  const [postData, ads, pages] = await Promise.all([getPosts(1, Math.min(visiblePostCount + 1, 500), language), settings.moduleAds ? getActiveAds(language) : Promise.resolve([]), getPublishedPages()]);
  const publishedPosts = postData.filter((post) => post.status === "published");
  const hasMorePosts = publishedPosts.length > visiblePostCount;
  const posts = publishedPosts.slice(0, visiblePostCount);
  const newsletterSlot = settings.moduleNewsletter && settings.newsletterEnabled ? Math.min(3, posts.length - 1) : -1;
  const adSlots = randomAdSlots(posts.length, ads, newsletterSlot >= 0 ? [newsletterSlot] : []);

  return (
    <div className="visitor-page flex min-h-screen flex-col items-center bg-[#efefef] px-5 pb-12 pt-5 text-[#0a0a0a]">
      <nav className="visitor-nav flex w-full max-w-[720px] items-center justify-between gap-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-[30px] items-start justify-start rounded-[10px] bg-[#0a0a0a] p-[7px]"><span className="size-[7px] rounded-full bg-white" /></span>
          <span className="visitor-heading text-[15px] font-bold tracking-[-.03em]">{settings.siteName}</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href={`/?lang=${language}`} className="flex h-[34px] items-center rounded-full bg-[#0a0a0a] px-3.5 text-sm font-semibold text-white">{language === "en" ? "Feed" : "Akış"}</Link>
          {pages.filter((page) => page.show_in_header).map((page) => <Link key={page.id} href={`/sayfa/${page.slug}?lang=${language}`} className="visitor-copy flex h-[34px] items-center rounded-full px-3.5 text-sm font-medium text-[#4a4a4a] hover:bg-[#f5f5f5]">{localizedPage(page, language).title}</Link>)}
        </div>
      </nav>

      <header id="hakkinda" className="flex w-full max-w-[720px] flex-col items-center gap-[18px] px-2 pb-10 pt-14 text-center">
        <h1 className="visitor-heading m-0 max-w-[560px] text-[24px] font-semibold leading-snug tracking-[-.03em] [text-wrap:pretty]">{language === "en" ? settings.descriptionEn : settings.description}</h1>
      </header>

      <main className="flex w-full max-w-[720px] flex-col gap-3">
        {posts.length ? posts.map((post, index) => (
          <div className="contents" key={post.id}>
            {(index === 3 || index === 5) && <div className="visitor-muted px-2 pb-2 pt-5 text-xs font-semibold tracking-[.16em] text-[#a1a1a1]">{dateLabel(post.published_at ?? post.created_at, language)}</div>}
            <NoteCard post={post} layout={settings.feedLayout} language={language} />
            {adSlots.has(index) && <AdCard ad={adSlots.get(index)!} />}
            {settings.moduleNewsletter && settings.newsletterEnabled && index === newsletterSlot && (
              <section className="flex flex-col items-stretch justify-between gap-5 rounded-[24px] bg-[#0a0a0a] p-6 text-white sm:flex-row sm:items-center">
                <div className="min-w-0"><h2 className="text-xl font-bold tracking-[-.035em]">{settings.newsletterTitle}</h2><p className="mt-1.5 text-sm font-medium text-[#a1a1a1] [text-wrap:pretty]">{settings.newsletterDescription}</p></div>
                <SubscribeForm />
              </section>
            )}
          </div>
        )) : <div className="visitor-panel visitor-muted rounded-[24px] bg-white px-6 py-12 text-center text-[#777]">{language === "en" ? "No English posts have been published yet." : "Henüz Türkçe yazı yayınlanmadı."}</div>}

        {hasMorePosts && <div className="flex justify-center pb-2 pt-6">
          <LoadMoreButton
            href={`/?lang=${language}&limit=${Math.min(visiblePostCount + settings.postsPerPage, 500)}`}
            label={language === "en" ? "More notes" : "Daha fazla not"}
          />
        </div>}

        <footer className="visitor-footer visitor-muted border-t border-[#e2e2e2] px-2 pt-7 text-[13px] font-medium text-[#a1a1a1]">
          <span>© {new Date().getFullYear()} {settings.siteName}</span><span className="ml-4 inline-flex gap-3">{pages.filter((page) => page.show_in_footer).map((page) => <Link key={page.id} href={`/sayfa/${page.slug}?lang=${language}`}>{localizedPage(page, language).title}</Link>)}</span>
        </footer>
      </main>
    </div>
  );
}
