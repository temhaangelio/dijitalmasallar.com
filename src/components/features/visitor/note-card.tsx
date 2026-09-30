import Image from "next/image";
import { ZoomableImage } from "@/components/features/visitor/zoomable-image";
import { splitAfterFirstParagraph } from "@/lib/post-content";
import Link from "next/link";
import type { ReactNode } from "react";
import { PostImageActions } from "@/components/features/visitor/post-image-actions";
import { sourceLabel } from "@/lib/source-label";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import { isOptimizableImage } from "@/lib/images";
import type { Post } from "@/types/database";

/** The note as it appears in the editorial feed: a flat entry in a single reading column. */

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
 *
 * `quiet` drops the weight of `**bold**`: the headline is set in one weight, because a sentence
 * that switches between regular and bold halfway through reads as two competing things.
 */
function renderFeedInline(content: string, highlight: string | undefined, keyPrefix: string, quiet = false): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|==([^=]+)==|_([^_\n]+)_|\*([^*\n]+)\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  const plain = (text: string, key: string): ReactNode | ReactNode[] => (highlight ? highlightMatches(text, highlight, key) : text);
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > cursor) nodes.push(plain(content.slice(cursor, match.index), `${keyPrefix}-plain-${match.index}`));
    const inner = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? "";
    const children = renderFeedInline(inner, highlight, `${keyPrefix}-${match.index}`, quiet);
    if (match[1] || match[2]) nodes.push(quiet ? <span key={`${keyPrefix}-strong-${match.index}`}>{children}</span> : <strong key={`${keyPrefix}-strong-${match.index}`} className="font-semibold">{children}</strong>);
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
 * `priority` is for the one note that opens the feed: its cover is the page's LCP, so it is not
 * lazy. `layout` is accepted for older call sites; the feed is one column everywhere now.
 */
export function NoteCard({ post, language, highlight, priority = false, latest = false }: {
  post: Post;
  language: VisitorLanguage;
  highlight?: string;
  priority?: boolean;
  /** The newest note in the feed, which earns the dot beside its time. */
  latest?: boolean;
  layout?: "column" | "grid";
}) {
  const paragraphs = feedParagraphs(post);
  const first = renderFeedInline(paragraphs.first, highlight, "first", true);
  const rest = paragraphs.rest ? renderFeedInline(paragraphs.rest, highlight, "rest") : [];
  const displayedSource = sourceLabel(null, post.source_url, language === "en" ? "Source" : "Kaynak");
  const postHref = languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en");
  const publishedAt = post.published_at ?? post.created_at;
  const cover = post.cover_path ? (
    <ZoomableImage src={post.cover_path} alt={post.title} language={language} className="feed-note-cover relative z-10 block aspect-video w-full overflow-hidden rounded-[8px] bg-surface-3">
      {isOptimizableImage(post.cover_path)
        ? <Image src={post.cover_path} alt={post.title} fill priority={priority} sizes="(max-width: 680px) calc(100vw - 32px), 600px" className="object-cover" />
        // eslint-disable-next-line @next/next/no-img-element -- source images may come from any official publisher host
        : <img src={post.cover_path} alt={post.title} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className="absolute inset-0 size-full object-cover" />}
    </ZoomableImage>
  ) : null;
  return (
    <article data-latest={latest || undefined} className="feed-note group relative">
      <div className="feed-note-meta visitor-sans">
        <time dateTime={publishedAt} title={fullDateLabel(publishedAt, language)} className="tabular-nums">{timeLabel(publishedAt, language)}</time>
        {latest ? <span className="feed-note-new" aria-hidden="true" /> : null}
      </div>
      <Link
        href={postHref}
        className="feed-note-title visitor-card-link visitor-copy visitor-sans block whitespace-pre-line text-ink [text-wrap:pretty] before:absolute before:inset-0 before:content-['']"
      >
        {first}
      </Link>
      {cover}
      {rest.length > 0 ? (
        <div className="feed-note-body visitor-copy visitor-serif whitespace-pre-line text-ink">
          {rest}
        </div>
      ) : null}
      <div className="feed-note-foot visitor-sans">
        {post.source_url
          ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" title={displayedSource} className="feed-note-source relative z-10 min-w-0 truncate text-muted transition-colors hover:text-ink">{displayedSource}<svg className="ml-1 inline-block size-2.5 align-baseline" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>
          : <span title={displayedSource} className="feed-note-source min-w-0 truncate text-muted">{displayedSource}</span>}
        <div className="feed-note-actions">
          <PostImageActions postId={post.id} href={postHref} title={post.title} language={language} placement="inline" />
        </div>
      </div>
    </article>
  );
}
