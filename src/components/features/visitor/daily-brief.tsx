import Link from "next/link";
import { DailyBriefSheet } from "@/components/features/visitor/daily-brief-sheet";
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

/** An optional catch-up, opened on request, that leaves the chronological feed in focus. */
export function DailyBrief({ posts, language, date, dateLabel, yesterday = false }: { posts: Post[]; language: VisitorLanguage; date: string; dateLabel: string; yesterday?: boolean }) {
  const items = briefItems(posts);
  if (!items.length) return null;

  return (
    <DailyBriefSheet language={language} title={briefHeading(language, yesterday)} date={date} dateLabel={dateLabel} count={items.length}>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {items.map(({ post, summary }, index) => (
          <li key={post.id}>
            <Link href={languageHref(`/haber/${post.id}`, language)} className="group/summary flex items-baseline gap-3 py-4 text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:gap-4">
              <span aria-hidden="true" className="visitor-sans shrink-0 text-[11px] tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
              <span className="visitor-copy visitor-serif text-[17px] leading-relaxed decoration-line-strong underline-offset-4 group-hover/summary:underline">{summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </DailyBriefSheet>
  );
}
