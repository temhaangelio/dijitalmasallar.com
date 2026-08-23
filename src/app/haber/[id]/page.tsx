import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { VisitorBackLink, VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref } from "@/lib/visitor-language";
import { sourceLabel } from "@/lib/source-label";
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
  return {
    title: { absolute: `${cleanMetadataText(post.title)} · ${settings.siteName}` },
    description: cleanMetadataText(post.excerpt).slice(0, 160),
  };
}

function dateLabel(value: string, language: "tr" | "en") {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function NewsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params;
  const lang = (await searchParams).lang;
  const requestedLanguage = lang === "en" || lang === "tr" ? lang : undefined;
  const [post, settings] = await Promise.all([getPublishedPostById(id, requestedLanguage), getSiteSettings()]);
  if (!post) notFound();

  const language = post.language === "en" ? "en" : "tr";
  const publishedAt = post.published_at ?? post.created_at;
  const displayedSource = sourceLabel(post.source_name, post.source_url, language === "en" ? "Source" : "Kaynak");
  const nextPost = await getNextPublishedPost(post.created_at, language);

  return (
    <VisitorShell language={language} siteName={settings.siteName} action={<VisitorBackLink language={language} label={language === "en" ? "Back" : "Geri dön"} />}>

      <main className="w-full max-w-[720px] pt-10">
        <article className="visitor-panel rounded-panel border border-line bg-surface p-6 sm:p-9">
          <div className="visitor-muted mb-7 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-muted">
            <time dateTime={publishedAt}>{dateLabel(publishedAt, language)}</time>
            <span>·</span>
            {post.source_url ? (
              <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source font-normal text-ink hover:underline">
                {displayedSource}
              </a>
            ) : (
              <span className="visitor-source font-normal text-ink">{displayedSource}</span>
            )}
          </div>
          <div className="visitor-markdown">
            <MarkdownPreview value={post.body} />
          </div>
        </article>

        {nextPost && (
          <Link href={languageHref(`/haber/${nextPost.id}`, language)} className="visitor-panel visitor-next group mt-3 block rounded-panel border border-line bg-surface p-6 transition-colors hover:bg-surface-2 sm:p-8">
            <span className="visitor-muted text-[11px] font-bold tracking-[.16em] text-muted">{language === "en" ? "NEXT STORY" : "SONRAKİ HABER"}</span>
            <div className="mt-4 flex items-end justify-between gap-6">
              <p className="visitor-copy max-w-[570px] text-[18px] font-normal leading-[1.65] text-ink [text-wrap:pretty]">{firstSentence(nextPost.body)}</p>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-ink-contrast transition-transform group-hover:translate-x-1" aria-hidden="true"><ArrowRight size={16} /></span>
            </div>
          </Link>
        )}
      </main>
    </VisitorShell>
  );
}
