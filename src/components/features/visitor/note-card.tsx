import Link from "next/link";
import type { ReactNode } from "react";
import { sourceLabel } from "@/lib/source-label";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
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
 * The note body as the list shows it: markdown stripped down to running text, with the two inline
 * marks that survive — `~~strike~~` and `==highlight==` — kept as real elements.
 */
export function feedContent(post: Post, highlight?: string): ReactNode[] {
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
  const plain = (text: string, key: string): ReactNode | ReactNode[] => (highlight ? highlightMatches(text, highlight, key) : text);
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > cursor) nodes.push(plain(content.slice(cursor, match.index), `lead-${match.index}`));
    if (match[1]) nodes.push(<del key={`strike-${match.index}`}>{match[1]}</del>);
    else nodes.push(<mark key={`highlight-${match.index}`} className="visitor-highlight rounded-[3px] px-1 py-0.5 text-inherit">{match[2]}</mark>);
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) nodes.push(plain(content.slice(cursor), `tail-${cursor}`));
  return nodes.length ? nodes : [plain(content, "only")];
}

export function NoteCard({ post, language, highlight }: { post: Post; language: VisitorLanguage; highlight?: string }) {
  const displayedSource = sourceLabel(post.source_name, post.source_url, language === "en" ? "Source" : "Kaynak");
  return (
    <article className="visitor-card group relative rounded-[14px] border border-line/70 bg-surface-2/35 px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,.018)] sm:px-6 sm:py-5">
      <Link
        href={languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en")}
        className="visitor-copy block text-[17px] font-normal leading-[1.5] text-ink transition-colors duration-200 [text-wrap:pretty] before:absolute before:inset-0 before:content-[''] hover:text-accent sm:text-[20px]"
      >
        {feedContent(post, highlight)}
      </Link>
      <div className="mt-2.5 flex min-w-0 items-center justify-end font-mono text-[11px] font-normal leading-[1.6]">
        {post.source_url
          ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" title={displayedSource} className="visitor-source relative z-10 inline-block max-w-full min-w-0 truncate border-b border-line text-muted transition-colors hover:border-accent hover:text-accent">{displayedSource} ↗</a>
          : <span title={displayedSource} className="visitor-source min-w-0 truncate text-faint">{displayedSource}</span>}
      </div>
    </article>
  );
}
