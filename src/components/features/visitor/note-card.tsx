import Image from "next/image";
import { ZoomableImage } from "@/components/features/visitor/zoomable-image";
import { splitAfterFirstParagraph } from "@/lib/post-content";
import Link from "next/link";
import type { ReactNode } from "react";
import { PostImageActions } from "@/components/features/visitor/post-image-actions";
import { sourceLabel } from "@/lib/source-label";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { dateLabel, fullDateLabel, timeLabel } from "@/lib/visitor-date";
import { isOptimizableImage } from "@/lib/images";
import type { Post } from "@/types/database";

/** The note as it appears in the editorial feed. */

/** Wraps every occurrence of `term` in `<mark>`, used to show why a search result matched. */
function highlightMatches(text: string, term: string, keyPrefix: string): ReactNode[] {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "gi");
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    // A zero-length match would never advance the cursor; only a bad escape can produce one.
    if (!match[0]) break;
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    // Tighter than an authored `==highlight==`: a search can light up several words in one
    // sentence, and the wider padding starts to look like the words have come apart.
    nodes.push(<mark key={`${keyPrefix}-match-${match.index}`} className="visitor-highlight rounded-[3px] px-0.5 text-inherit">{match[0]}</mark>);
    cursor = match.index + match[0].length;
  }
  if (!nodes.length) return [text];
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/**
 * Renders the compact set of inline Markdown supported by the editor. Calling the function again
 * for matched content also preserves combinations such as `**_bold italic_**`.
 */
function renderFeedInline(content: string, highlight: string | undefined, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|==([^=]+)==|_([^_\n]+)_|\*([^*\n]+)\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  const plain = (text: string, key: string): ReactNode | ReactNode[] => (highlight ? highlightMatches(text, highlight, key) : text);
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > cursor) nodes.push(plain(content.slice(cursor, match.index), `${keyPrefix}-plain-${match.index}`));
    const inner = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? "";
    const children = renderFeedInline(inner, highlight, `${keyPrefix}-${match.index}`);
    if (match[1] || match[2]) nodes.push(<strong key={`${keyPrefix}-strong-${match.index}`} className="font-semibold">{children}</strong>);
    else if (match[3]) nodes.push(<del key={`${keyPrefix}-strike-${match.index}`}>{children}</del>);
    else if (match[4]) nodes.push(<mark key={`${keyPrefix}-highlight-${match.index}`} className="visitor-highlight rounded-[3px] px-1 py-0.5 text-inherit">{children}</mark>);
    else nodes.push(<em key={`${keyPrefix}-italic-${match.index}`}>{children}</em>);
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) nodes.push(plain(content.slice(cursor), `${keyPrefix}-tail-${cursor}`));
  return nodes.length ? nodes : [plain(content, "only")];
}

/** The note body as the list shows it, with paragraph breaks and inline emphasis preserved. */
function feedParagraphs(post: Post) {
  const withoutHeading = post.body.replace(/^#\s+[^\n]+\n+/i, "");
  const content = withoutHeading
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || post.excerpt;
  return splitAfterFirstParagraph(content);
}

/**
 * `priority` is for the one note that opens the feed. Every cover was lazy, the topmost included,
 * so the largest thing on the first screen was fetched only after the browser had finished laying
 * the page out — which is the page's LCP arriving late for no reason.
 */
export function NoteCard({ post, language, highlight, priority = false, latest = false, layout = "column" }: {
  post: Post;
  language: VisitorLanguage;
  highlight?: string;
  priority?: boolean;
  /** The newest note in the feed, which earns the dot beside its dateline. */
  latest?: boolean;
  /**
   * How the card sits from 1280px up. `column` is the single reading column and changes nothing.
   * `grid` is one of two cards side by side, so the type steps down. `featured` is a day's opening
   * note across the full width, with the cover standing beside the text instead of under it.
   */
  layout?: "column" | "grid" | "featured";
}) {
  const paragraphs = feedParagraphs(post);
  const grid = layout === "grid";
  const featured = layout === "featured";
  const first = renderFeedInline(paragraphs.first, highlight, "first");
  const rest = paragraphs.rest ? renderFeedInline(paragraphs.rest, highlight, "rest") : [];
  const displayedSource = sourceLabel(null, post.source_url, language === "en" ? "Source" : "Kaynak");
  const postHref = languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en");
  const publishedAt = post.published_at ?? post.created_at;
  const cover = post.cover_path ? (
    <ZoomableImage src={post.cover_path} alt={post.title} language={language} className={`relative z-10 mt-5 block aspect-video w-full overflow-hidden rounded-[10px] bg-surface-3${featured ? " xl:col-start-2 xl:row-span-3 xl:row-start-1 xl:mt-0 xl:self-start" : ""}${grid ? " xl:order-first xl:mt-0 xl:mb-5" : ""}`}>
      {isOptimizableImage(post.cover_path)
        ? <Image src={post.cover_path} alt={post.title} fill priority={priority} sizes={featured ? "(max-width: 680px) calc(100vw - 72px), (min-width: 1280px) 460px, 590px" : grid ? "(max-width: 680px) calc(100vw - 72px), (min-width: 1280px) 430px, 590px" : "(max-width: 680px) calc(100vw - 72px), 590px"} className="object-cover" />
        // eslint-disable-next-line @next/next/no-img-element -- source images may come from any official publisher host
        : <img src={post.cover_path} alt={post.title} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className="absolute inset-0 size-full object-cover" />}
    </ZoomableImage>
  ) : null;
  return (
    <article className={`visitor-card group relative transition-colors hover:border-line-strong${grid ? " xl:flex xl:flex-1 xl:flex-col" : ""}`}>
      <div className={`min-w-0 flex-1 px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6${featured && post.cover_path ? " xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-8 xl:px-7 xl:pt-7" : ""}${grid ? " xl:flex xl:flex-col xl:px-5 xl:pt-5" : ""}`}>
        <time
          dateTime={publishedAt}
          title={fullDateLabel(publishedAt, language)}
          className={`visitor-note-time visitor-sans${featured ? " xl:col-start-1" : ""}`}
        >
          <span>{dateLabel(publishedAt, language)}</span>
          <span className="visitor-note-time-dot" aria-hidden="true">·</span>
          <span className="tabular-nums">{timeLabel(publishedAt, language)}</span>
          {latest ? <span className="visitor-note-time-new" aria-hidden="true" /> : null}
        </time>
        <Link
          href={postHref}
          className={`visitor-note-initial visitor-card-link visitor-copy visitor-serif block whitespace-pre-line text-[18px] font-normal leading-[1.65] text-ink transition-colors duration-200 [text-wrap:pretty] before:absolute before:inset-0 before:content-[''] sm:text-[20px] sm:leading-[1.6]${featured ? " xl:col-start-1" : ""}`}
        >
          {first}
        </Link>
        {cover}
        {rest.length > 0 ? (
          <div className={`visitor-note-body visitor-copy visitor-serif mt-5 whitespace-pre-line text-[18px] leading-[1.65] text-ink sm:text-[20px] sm:leading-[1.6]${grid ? " xl:mt-3" : ""}${featured ? " xl:col-start-1" : ""}`}>
            {rest}
          </div>
        ) : null}
        <div className={`mt-5 flex min-w-0 items-center justify-between gap-3 pt-2 visitor-sans text-[12px] font-normal leading-[1.6]${featured ? " xl:col-span-2" : ""}${grid ? " xl:mt-auto xl:pt-1" : ""}`}>
          {post.source_url
            ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" title={displayedSource} className="visitor-source relative z-10 block min-h-11 min-w-0 truncate py-3 text-muted transition-colors hover:border-accent hover:text-accent">{displayedSource}<svg className="ml-1 inline-block size-2.5 align-baseline" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>
            : <span title={displayedSource} className="visitor-source min-w-0 truncate text-muted">{displayedSource}</span>}
          <PostImageActions postId={post.id} href={postHref} title={post.title} language={language} placement="inline" />
        </div>
      </div>
    </article>
  );
}
