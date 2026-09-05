import Link from "next/link";
import { summaryLine } from "@/lib/post-content";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

/** An optional catch-up that leaves the chronological feed in focus. */
export function DailyBrief({ posts, language, date, dateLabel }: { posts: Post[]; language: VisitorLanguage; date: string; dateLabel: string }) {
  const items = posts
    .map((post) => ({ post, summary: summaryLine({ excerpt: "", body: post.body }, 10_000) }))
    .filter((item) => item.summary);
  if (!items.length) return null;
  const isEnglish = language === "en";

  return (
    <details className="group/brief mb-7 rounded-[16px] bg-surface-2/65 sm:mb-9">
      <summary className="flex min-h-[92px] cursor-pointer list-none items-center justify-between gap-4 rounded-[16px] px-5 py-5 text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-col gap-1.5">
          <time dateTime={date} className="text-[12px] leading-5 text-muted">{dateLabel}</time>
          <span className="visitor-serif text-[18px] font-normal leading-6 sm:text-[20px]">{isEnglish ? "Today’s brief" : "Günün özeti"}</span>
        </span>
        <span className="flex min-h-11 shrink-0 items-center gap-3 rounded-full bg-canvas px-3.5 text-ink">
          <span className="whitespace-nowrap text-xs font-medium tabular-nums">{items.length}{" "}{isEnglish ? "notes" : "not"}</span>
          <svg className="size-4 transition-transform duration-150 group-open/brief:rotate-180 motion-reduce:transition-none" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
