import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import { languageHref } from "@/lib/visitor-language";
import { sourceLabel } from "@/lib/source-label";
import { absoluteUrl, jsonLd, postDescription, postHeadline, siteUrl } from "@/lib/seo";
import { getNextPublishedPost, getPublishedPostById } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

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
  const [post, settings] = await Promise.all([getPublishedPostById(id, requestedLanguage), getSiteSettings()]);
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
      languages: { en: path, tr: `${path}?lang=tr`, "x-default": path },
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
  const [post, settings] = await Promise.all([getPublishedPostById(id, requestedLanguage), getSiteSettings()]);
  if (!post) notFound();

  const language = post.language === "en" ? "en" : "tr";
  const publishedAt = post.published_at ?? post.created_at;
  const displayedSource = sourceLabel(null, post.source_url, language === "en" ? "Source" : "Kaynak");
  const nextPost = await getNextPublishedPost(post.created_at, language);
  const baseUrl = siteUrl(settings.domain);
  const canonicalUrl = absoluteUrl(baseUrl, languageHref(`/haber/${post.id}`, language));
  const headline = postHeadline(post);
  const description = postDescription(post);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${canonicalUrl}#article`,
    headline,
    description,
    articleBody: cleanMetadataText(post.body),
    datePublished: publishedAt,
    dateModified: post.updated_at,
    inLanguage: language,
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    author: { "@type": "Organization", name: settings.siteName, url: baseUrl },
    publisher: { "@type": "NewsMediaOrganization", "@id": `${baseUrl}/#organization`, name: settings.siteName, url: baseUrl },
    image: post.cover_path ? [post.cover_path] : undefined,
    isBasedOn: post.source_url || undefined,
  };

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <main className="w-full max-w-[640px] pt-11 sm:pt-14">
        <article className="visitor-article rounded-[14px] border border-line/70 bg-surface-2/35 px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,.018)] sm:px-6 sm:py-6">
          <div className="visitor-muted mb-8 border-b border-line pb-5 font-mono">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <time dateTime={publishedAt} className="text-[11px] font-medium leading-none tabular-nums text-accent sm:text-[12px]">
                {timeLabel(publishedAt, language)}
              </time>
              <span className="text-[11px] font-normal leading-none text-muted sm:text-[12px]">{fullDateLabel(publishedAt, language)}</span>
            </div>
          </div>
          <div className="visitor-markdown visitor-serif">
            <MarkdownPreview value={post.body} />
          </div>
          {post.source_url && (
            <div className="visitor-muted mt-9 flex justify-end font-mono text-[11px] font-normal leading-[1.6]">
              {post.source_url ? (
                <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source tracking-[.04em] text-ink transition-opacity hover:opacity-60">{displayedSource}</a>
              ) : null}
            </div>
          )}
        </article>

        {nextPost && (
          <Link href={languageHref(`/haber/${nextPost.id}`, language)} className="visitor-next group mt-8 block sm:mt-10">
            <span className="visitor-muted font-mono text-[10px] font-medium uppercase tracking-[.18em] text-faint sm:text-[11px]">{language === "en" ? "Next story" : "Sonraki haber"}</span>
            <div className="mt-4 flex items-start justify-between gap-6">
              <p className="visitor-copy max-w-[540px] text-[17px] font-normal leading-[1.55] text-ink transition-colors group-hover:text-accent sm:text-[20px] sm:leading-[1.5]">{firstSentence(nextPost.body)}</p>
              <span className="mt-1 shrink-0 text-muted transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true"><ArrowRight size={18} strokeWidth={1.5} /></span>
            </div>
          </Link>
        )}
      </main>
    </VisitorShell>
  );
}
