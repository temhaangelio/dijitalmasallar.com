import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarkdownPreview } from "@/components/forms/markdown-preview";
import { VisitorThemeSync } from "@/components/features/visitor/visitor-preferences";
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
    title: `${cleanMetadataText(post.title)} · ${settings.siteName}`,
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
  const nextPost = await getNextPublishedPost(post.created_at, language);

  return (
    <div className="visitor-page flex min-h-screen flex-col items-center bg-[#efefef] px-5 pb-12 pt-5 text-[#0a0a0a]">
      <VisitorThemeSync />
      <nav className="visitor-nav flex w-full max-w-[720px] items-center justify-between gap-4 py-2.5">
        <Link href={`/?lang=${language}`} className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-[30px] items-start justify-start rounded-[10px] bg-[#0a0a0a] p-[7px]"><span className="size-[7px] rounded-full bg-white" /></span>
          <span className="visitor-heading text-[15px] font-bold tracking-[-.03em]">{settings.siteName}</span>
        </Link>
        <Link href={`/?lang=${language}`} className="visitor-copy flex h-[34px] items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#4a4a4a] hover:bg-[#f5f5f5]">
          <ArrowLeft size={14} /> {language === "en" ? "Back" : "Geri dön"}
        </Link>
      </nav>

      <main className="w-full max-w-[720px] pt-10">
        <article className="visitor-panel rounded-[24px] border border-[#e7e7e7] bg-white p-6 sm:p-9">
          <div className="visitor-muted mb-7 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#999]">
            <time dateTime={publishedAt}>{dateLabel(publishedAt, language)}</time>
            <span>·</span>
            {post.source_url ? (
              <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source text-[#0a0a0a] hover:underline">
                {post.source_name || (language === "en" ? "Source" : "Kaynak")}
              </a>
            ) : (
              <span className="visitor-source text-[#0a0a0a]">{post.source_name || (language === "en" ? "Source" : "Kaynak")}</span>
            )}
          </div>
          <div className="visitor-markdown">
            <MarkdownPreview value={post.body} />
          </div>
        </article>

        {nextPost && (
          <Link href={`/haber/${nextPost.id}?lang=${language}`} className="visitor-panel visitor-next group mt-3 block rounded-[24px] border border-[#e7e7e7] bg-white p-6 transition-colors hover:bg-[#fafafa] sm:p-8">
            <span className="visitor-muted text-[11px] font-bold tracking-[.16em] text-[#a1a1a1]">{language === "en" ? "NEXT STORY" : "SONRAKİ HABER"}</span>
            <div className="mt-4 flex items-end justify-between gap-6">
              <p className="visitor-copy max-w-[570px] text-[18px] font-normal leading-[1.65] text-[#272727] [text-wrap:pretty]">{firstSentence(nextPost.body)}</p>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1" aria-hidden="true"><ArrowRight size={16} /></span>
            </div>
          </Link>
        )}
      </main>
    </div>
  );
}
