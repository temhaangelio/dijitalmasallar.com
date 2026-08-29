"use client";

import Link from "next/link";
import { useState } from "react";
import { summaryLine } from "@/lib/post-content";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

/** A human-paced opening note assembled only from the editor-written summaries of today's posts. */
export function DailyBrief({ posts, language }: { posts: Post[]; language: VisitorLanguage }) {
  const [expanded, setExpanded] = useState(false);
  const items = posts
    .map((post) => ({ post, summary: summaryLine({ excerpt: "", body: post.body }, 10_000) }))
    .filter((item) => item.summary);

  if (!items.length) return null;

  const isEnglish = language === "en";
  const splitAt = Math.ceil(items.length / 2);
  const paragraphs = [items.slice(0, splitAt), items.slice(splitAt)].filter((paragraph) => paragraph.length);
  const canExpand = items.length > 1;
  const visibleParagraphs = expanded ? paragraphs : [items.slice(0, 1)];

  return (
    <aside aria-labelledby="daily-brief-title" className="visitor-card mb-14 rounded-[14px] border border-line/70 bg-surface-2/35 px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,.018)] sm:mb-16 sm:px-6 sm:py-6">
      <h2 id="daily-brief-title" className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[.2em] text-accent">
        {isEnglish ? "Today’s brief" : "Günün özeti"}
      </h2>

      <div id="daily-brief-content" className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
        {visibleParagraphs.map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex} className="visitor-serif max-w-[600px] text-[18px] font-normal leading-[1.52] text-ink sm:text-[21px] sm:leading-[1.5]">
            {paragraph.map(({ post, summary }, itemIndex) => (
              <span key={post.id}>
                {itemIndex ? " " : null}
                <Link href={languageHref(`/haber/${post.id}`, language)} className="transition-colors hover:text-accent">
                  {summary}
                </Link>
              </span>
            ))}
          </p>
        ))}
      </div>

      {canExpand ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="daily-brief-content"
          onClick={() => setExpanded((current) => !current)}
          className="visitor-source ml-auto mt-5 block border-b border-line pb-0.5 font-mono text-[11px] font-normal leading-[1.6] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {expanded
            ? (isEnglish ? "Show Less ↑" : "Daha Az Göster ↑")
            : (isEnglish ? "More ↓" : "Devamı ↓")}
        </button>
      ) : null}
    </aside>
  );
}
