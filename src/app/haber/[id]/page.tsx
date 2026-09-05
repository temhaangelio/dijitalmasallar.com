import { ZoomableImage } from "@/components/features/visitor/zoomable-image";
import { noteInitialTone } from "@/lib/note-initial";
import { cache } from "react";
import type { Metadata } from "next";
import { splitAfterFirstParagraph } from "@/lib/post-content";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PostImageActions } from "@/components/features/visitor/post-image-actions";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import { languageHref } from "@/lib/visitor-language";
import { isOptimizableImage } from "@/lib/images";
import { sourceLabel } from "@/lib/source-label";
import { absoluteUrl, jsonLd, postDescription, postHeadline, siteUrl } from "@/lib/seo";
import { getNextPublishedPost, getPublishedPostById } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

// Metadata and the page share one lookup per request, without retaining stale posts across visits.
const getNewsPost = cache(getPublishedPostById);

function cleanMetadataText(value: string) {
  return value.replace(/[#*_`=]/g, "").replace(/\s+/g, " ").trim();
}

function firstSentence(value: string) {
  const content = value
    .replace(/^#\s+[^\n]+\n+/i, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`=]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = content.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  if (sentence) return sentence;
  return content.length > 180 ? `${content.slice(0, 177).trimEnd()}…` : content;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lang = (await searchParams).lang;
  const requestedLanguage = lang === "en" || lang === "tr" ? lang : undefined;
  const [post, settings] = await Promise.all([getNewsPost(id, requestedLanguage), getSiteSettings()]);
  if (!post) return {};
  const language = post.language === "en" ? "en" : "tr";
  const baseUrl = siteUrl(settings.domain);
  const path = `/haber/${post.id}`;
  const canonical = languageHref(path, language);
  const title = postHeadline(post);
  const description = postDescription(post);
  const publishedAt = post.published_at ?? post.created_at;
  return {
    title: { absolute: `${title} · ${settings.siteName}` },
    description,
    alternates: {
      canonical,
      languages: { tr: path, en: `${path}?lang=en`, "x-default": path },
      types: { "application/rss+xml": languageHref("/feed.xml", language) },
    },
    openGraph: {
      type: "article",
      siteName: settings.siteName,
      title,
      description,
      url: absoluteUrl(baseUrl, canonical),
      locale: language === "en" ? "en_US" : "tr_TR",
      publishedTime: publishedAt,
      modifiedTime: post.updated_at,
      authors: [settings.siteName],
      images: post.cover_path ? [{ url: post.cover_path, alt: title }] : undefined,
    },
    twitter: {
      card: post.cover_path ? "summary_large_image" : "summary",
      title,
      description,
      images: post.cover_path ? [post.cover_path] : undefined,
    },
  };
}

export default async function NewsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params;
  const lang = (await searchParams).lang;
  const requestedLanguage = lang === "en" || lang === "tr" ? lang : undefined;
  const [post, settings] = await Promise.all([getNewsPost(id, requestedLanguage), getSiteSettings()]);
  if (!post) notFound();

  const language = post.language === "en" ? "en" : "tr";
  const publishedAt = post.published_at ?? post.created_at;
  const displayedSource = sourceLabel(null, post.source_url, language === "en" ? "Source" : "Kaynak");
  const nextPost = await getNextPublishedPost(post.created_at, language);
  const baseUrl = siteUrl(settings.domain);
  const canonicalUrl = absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, language));
  const postHref = languageHref(`/haber/${post.id}`, language);
  const headline = postHeadline(post);
  const paragraphs = splitAfterFirstParagraph(post.body);
  const description = postDescription(post);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${canonicalUrl}#article`,
    url: canonicalUrl,
    headline,
    description,
    articleBody: cleanMetadataText(post.body),
    datePublished: publishedAt,
    dateModified: post.updated_at,
    inLanguage: language,
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    author: { "@type": "Person", name: "Temha Angelio", url: "https://www.temhaangelio.com/" },
    publisher: { "@type": "NewsMediaOrganization", "@id": `${baseUrl}/#organization`, name: settings.siteName, url: baseUrl },
    image: post.cover_path ? [post.cover_path] : undefined,
    isBasedOn: post.source_url || undefined,
    articleSection: language === "en" ? "Technology" : "Teknoloji",
    keywords: language === "en" ? ["technology", "artificial intelligence", "science", "digital culture"] : ["teknoloji", "yapay zekâ", "bilim", "dijital kültür"],
  };

  return (
    <VisitorShell language={language} siteName={settings.siteName} compact reading>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <main className="w-full max-w-[640px] pt-4 sm:pt-6">
        <article data-initial-tone={noteInitialTone(post.id)} className="visitor-card visitor-article">
          <div className="px-4 py-5 sm:px-6 sm:py-6">
        <header className="visitor-sans mb-5 flex items-center justify-between gap-3 border-b border-line pb-4 sm:mb-6">
          <Link href={languageHref("/", language)} className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md pr-2 text-[13px] font-medium text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent">
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            <span>{language === "en" ? "Back to feed" : "Akışa dön"}</span>
          </Link>
          <time dateTime={publishedAt} className="flex min-w-0 flex-col items-end text-right text-[11px] leading-5 tabular-nums text-muted sm:flex-row sm:items-center sm:gap-2 sm:text-xs">
            <span>{fullDateLabel(publishedAt, language)}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="font-medium text-accent">{timeLabel(publishedAt, language)}</span>
          </time>
        </header>
          <div className="visitor-markdown visitor-serif visitor-article-intro">
            <MarkdownPreview value={paragraphs.first} />
          </div>
          {post.cover_path && (
            <ZoomableImage src={post.cover_path} alt={headline} language={language} className="relative my-5 block aspect-[16/9] w-full overflow-hidden rounded-[10px] bg-surface-3">
              {isOptimizableImage(post.cover_path)
                ? <Image src={post.cover_path} alt={headline} fill priority sizes="(max-width: 700px) 100vw, 640px" className="object-cover" />
                // eslint-disable-next-line @next/next/no-img-element -- source images may come from any official publisher host
                : <img src={post.cover_path} alt={headline} decoding="async" className="absolute inset-0 size-full object-cover" />}
            </ZoomableImage>
          )}
          {paragraphs.rest ? <div className="visitor-markdown visitor-serif mt-5"><MarkdownPreview value={paragraphs.rest} /></div> : null}
          <div className="mt-3 flex min-w-0 items-center justify-between gap-3 visitor-sans text-[11px] font-normal leading-[1.6]">
            {post.source_url
              ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" title={displayedSource} className="visitor-source block min-h-11 min-w-0 truncate py-3 text-muted transition-colors hover:text-accent">{displayedSource}<svg className="ml-1 inline-block size-2.5 align-baseline" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>
              : <span title={displayedSource} className="visitor-source min-w-0 truncate text-muted">{displayedSource}</span>}
            <PostImageActions postId={post.id} href={postHref} title={headline} language={language} placement="inline" />
          </div>
          </div>
        </article>

        {nextPost && (
          <Link href={languageHref(`/haber/${nextPost.id}`, language)} className="visitor-next group mt-8 block sm:mt-10">
            <span className="visitor-muted visitor-sans text-[10px] font-medium uppercase tracking-[.18em] text-muted sm:text-[11px]">{language === "en" ? "Next story" : "Sonraki haber"}</span>
            <div className="mt-4 flex items-start justify-between gap-6">
      <p className="visitor-copy visitor-serif max-w-[540px] text-[17px] font-normal leading-[1.55] text-ink transition-colors group-hover:text-accent sm:text-[20px] sm:leading-[1.5]">{firstSentence(nextPost.body)}</p>
              <span className="mt-1 shrink-0 text-muted transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true"><ArrowRight size={18} strokeWidth={1.5} /></span>
            </div>
          </Link>
        )}
      </main>
    </VisitorShell>
  );
}
