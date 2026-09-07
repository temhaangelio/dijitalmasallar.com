import Link from "next/link";
import { summaryLine } from "@/lib/post-content";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

/**
 * A post without a usable summary line cannot be listed, so the count the brief shows is not the
 * number of posts handed to it. Exported because the margin navigation shows the same count, and
 * two ways of counting the same list is one too many.
 */
export function briefItems(posts: Post[]) {
  return posts
    .map((post) => ({ post, summary: summaryLine({ excerpt: "", body: post.body }, 10_000) }))
    .filter((item) => item.summary);
}

export function briefHeading(language: VisitorLanguage, yesterday: boolean) {
  if (language === "en") return yesterday ? "Yesterday’s brief" : "Today’s brief";
  return yesterday ? "Dünün özeti" : "Günün özeti";
}

/** An optional catch-up that leaves the chronological feed in focus. */
export function DailyBrief({ posts, language, date, dateLabel, yesterday = false }: { posts: Post[]; language: VisitorLanguage; date: string; dateLabel: string; yesterday?: boolean }) {
  const items = briefItems(posts);
  if (!items.length) return null;
  const isEnglish = language === "en";

  return (
    <details id="daily-brief" className="visitor-card visitor-brief group/brief mb-7 sm:mb-9">
      <summary className="flex min-h-[80px] cursor-pointer list-none items-center justify-between gap-3 rounded-[13px] px-5 py-3 text-ink transition-colors duration-150 hover:bg-surface-2/30 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="visitor-serif text-[20px] font-normal leading-7 tracking-[-.025em] sm:text-[22px]">{briefHeading(language, yesterday)}</span>
          <time dateTime={date} className="visitor-sans text-[11px] leading-5 text-muted">{dateLabel}</time>
        </span>
        <span className="flex min-h-11 shrink-0 items-center gap-3 sm:gap-4">
          <span className="rounded-full border border-line px-2.5 py-1 whitespace-nowrap text-[12px] leading-5 text-muted"><span className="font-medium tabular-nums text-ink-2">{items.length}</span>{" "}{isEnglish ? "notes" : "not"}</span>
          <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-muted transition-colors duration-150 group-hover/brief:text-accent group-open/brief:text-accent">
            <svg className="size-4 transition-transform duration-200 group-open/brief:rotate-180 motion-reduce:transition-none" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5.5 8 4.5 4.5L14.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </summary>
      {/* The rule belongs to the list, not to the summary, so it exists only while the brief is open —
          a line under a closed heading would be drawing a box around nothing. It runs the full width
          of the card rather than sitting inside the padding, which is how every other divider on the
          site is drawn. */}
      <ul className="divide-y divide-line border-t border-line px-5 py-2 sm:px-6">
        {items.map(({ post, summary }, index) => (
          <li key={post.id}>
            <Link href={languageHref(`/haber/${post.id}`, language)} className="group/summary flex items-baseline gap-3 py-4 text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:gap-4">
              <span aria-hidden="true" className="visitor-sans shrink-0 text-[11px] tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
              <span className="visitor-copy visitor-serif text-[17px] leading-relaxed decoration-line-strong underline-offset-4 group-hover/summary:underline">{summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
