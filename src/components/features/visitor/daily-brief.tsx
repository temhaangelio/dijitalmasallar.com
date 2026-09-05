import Link from "next/link";
import { summaryLine } from "@/lib/post-content";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

/** An optional catch-up that leaves the chronological feed in focus. */
export function DailyBrief({ posts, language, date, dateLabel, yesterday = false }: { posts: Post[]; language: VisitorLanguage; date: string; dateLabel: string; yesterday?: boolean }) {
  const items = posts
    .map((post) => ({ post, summary: summaryLine({ excerpt: "", body: post.body }, 10_000) }))
    .filter((item) => item.summary);
  if (!items.length) return null;
  const isEnglish = language === "en";

  return (
    <details className="visitor-card group/brief mb-7 sm:mb-9">
      <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 rounded-[13px] px-5 py-2 text-ink transition-colors duration-150 hover:bg-surface-2/30 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="visitor-serif text-[20px] font-normal leading-7 tracking-[-.025em] sm:text-[22px]">{yesterday ? (isEnglish ? "Yesterday’s brief" : "Dünün özeti") : (isEnglish ? "Today’s brief" : "Günün özeti")}</span>
          {!yesterday && <time dateTime={date} className="text-[11px] leading-5 text-muted">{dateLabel}</time>}
        </span>
        <span className="flex min-h-11 shrink-0 items-center gap-3 sm:gap-4">
          <span className="whitespace-nowrap text-[12px] leading-5 text-muted"><span className="font-medium tabular-nums text-ink-2">{items.length}</span>{" "}{isEnglish ? "notes" : "not"}</span>
          <span className="grid size-7 place-items-center text-muted transition-colors duration-150 group-hover/brief:text-accent group-open/brief:text-accent">
            <svg className="size-4 transition-transform duration-200 group-open/brief:rotate-180 motion-reduce:transition-none" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5.5 8 4.5 4.5L14.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </summary>
      <ul className="space-y-4 px-5 pb-6 pt-1 sm:px-6 sm:pb-7">
        {items.map(({ post, summary }) => (
          <li key={post.id}>
            <Link href={languageHref(`/haber/${post.id}`, language)} className="visitor-serif block py-1 text-[17px] leading-relaxed text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
              {summary}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
