import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PostImageActions } from "@/components/features/visitor/post-image-actions";
import { sourceLabel } from "@/lib/source-label";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
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
export function feedContent(post: Post, highlight?: string): ReactNode[] {
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
  return renderFeedInline(content, highlight, "feed");
}

export function NoteCard({ post, language, highlight }: { post: Post; language: VisitorLanguage; highlight?: string }) {
  const displayedSource = sourceLabel(null, post.source_url, language === "en" ? "Source" : "Kaynak");
  const postHref = languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en");
  return (
    <article className="visitor-card group relative transition-colors hover:border-line-strong">
      {post.cover_path && (
        <div className="relative aspect-video w-full bg-surface-3">
          {isOptimizableImage(post.cover_path)
            ? <Image src={post.cover_path} alt={post.title} fill sizes="(max-width: 767px) 100vw, 640px" className="object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
            // eslint-disable-next-line @next/next/no-img-element -- source images may come from any official publisher host
            : <img src={post.cover_path} alt={post.title} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />}
          <PostImageActions postId={post.id} href={postHref} title={post.title} language={language} />
        </div>
      )}
      <div className="min-w-0 flex-1 px-5 py-4 sm:px-6 sm:py-5">
        <Link
          href={postHref}
          className="visitor-card-link visitor-copy visitor-serif block whitespace-pre-line text-[18px] font-normal leading-[1.52] text-ink transition-colors duration-200 [text-wrap:pretty] before:absolute before:inset-0 before:content-[''] hover:text-accent sm:text-[21px] sm:leading-[1.5]"
        >
          {feedContent(post, highlight)}
        </Link>
        <div className="mt-2.5 flex min-w-0 items-center justify-end font-mono text-[11px] font-normal leading-[1.6]">
          {post.source_url
            ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" title={displayedSource} className="visitor-source relative z-10 inline-block max-w-full min-w-0 truncate border-b border-line text-muted transition-colors hover:border-accent hover:text-accent">{displayedSource} ↗</a>
            : <span title={displayedSource} className="visitor-source min-w-0 truncate text-faint">{displayedSource}</span>}
        </div>
      </div>
    </article>
  );
}
