import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { sourceBadgeInitials, sourceLabel } from "@/lib/source-label";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { SiteSettings } from "@/services/settings";
import type { Post } from "@/types/database";

/**
 * The note as it appears in a list: the feed and the search results share this card, so a change to
 * one cannot leave the other behind.
 */

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

export function NoteCard({ post, layout, language, highlight }: { post: Post; layout: SiteSettings["feedLayout"]; language: VisitorLanguage; highlight?: string }) {
  const layoutClass = layout === "card" ? "border-line shadow-card" : layout === "classic" ? "border-line-strong" : "border-transparent";
  const displayedSource = sourceLabel(post.source_name, post.source_url, language === "en" ? "Source" : "Kaynak");
  return (
    <article className={`visitor-card group relative rounded-panel border bg-surface p-5 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft sm:p-6 ${layoutClass}`}>
      {/*
        The note link stretches over the whole card through its own `::before`, so the meta row is
        part of the target too. Reading the note no longer dims the text on hover — the lift, the
        border and the arrow carry the affordance, and the copy stays at full contrast while the
        pointer rests on it.
      */}
      <Link
        href={languageHref(`/haber/${post.id}`, post.language === "tr" ? "tr" : "en")}
        className="visitor-copy block text-[length:var(--vt-body)] font-normal leading-[1.7] text-ink [text-wrap:pretty] before:absolute before:inset-0 before:rounded-panel before:content-['']"
      >
        {feedContent(post, highlight)}
      </Link>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4 text-[length:var(--vt-meta)]">
        {post.source_url
          ? <a href={post.source_url} target="_blank" rel="noreferrer noopener nofollow" className="visitor-source relative z-10 inline-flex items-center gap-2.5 tracking-[.04em] text-muted transition-colors hover:text-ink"><span className="visitor-source-badge grid size-7 shrink-0 place-items-center rounded-[9px] bg-surface-2 font-mono text-[9px] font-semibold tracking-[.04em] text-ink-2" aria-hidden="true">{sourceBadgeInitials(post.source_url, displayedSource, language)}</span><span>{displayedSource}</span></a>
          : <span className="visitor-source inline-flex items-center gap-2.5 tracking-[.04em] text-faint"><span className="visitor-source-badge grid size-7 shrink-0 place-items-center rounded-[9px] bg-surface-2 font-mono text-[9px] font-semibold tracking-[.04em] text-ink-2" aria-hidden="true">{sourceBadgeInitials(post.source_url, displayedSource, language)}</span><span>{displayedSource}</span></span>}
        <span className="shrink-0 text-faint transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden="true"><ArrowRight size={15} /></span>
      </div>
    </article>
  );
}
