"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { isOptimizableImage } from "@/lib/images";
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
  const collagePosts = posts.filter((post, index, all) => post.cover_path && all.findIndex((item) => item.cover_path === post.cover_path) === index);
  const collageRowBreak = collagePosts.length <= 2 ? collagePosts.length : Math.ceil(collagePosts.length / 2);
  const collageRows = collagePosts.length
    ? [collagePosts.slice(0, collageRowBreak), collagePosts.slice(collageRowBreak)].filter((row) => row.length)
    : [];
  const briefHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="daily-brief-title" className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[.18em] text-accent">
        {isEnglish ? "Today’s brief" : "Günün özeti"}
      </h2>
      <span className="inline-flex items-center gap-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] text-muted sm:text-[10px]">
        <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
        {isEnglish ? "Day in progress" : "Gün devam ediyor"}
      </span>
    </div>
  );

  return (
    <aside aria-labelledby="daily-brief-title" className="visitor-card mb-14 overflow-hidden rounded-[14px] border border-line/70 bg-surface-2/35 px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,.018)] sm:mb-16 sm:px-6 sm:py-6">
      {collagePosts.length ? (
        <div className={`relative -mx-5 -mt-5 mb-5 grid gap-0.5 bg-line sm:-mx-6 sm:-mt-6 sm:mb-6 ${collageRows.length === 1 ? "h-[150px] sm:h-[190px]" : "h-[200px] grid-rows-2 sm:h-[240px]"}`} aria-label={isEnglish ? "Images from today’s stories" : "Bugünkü haberlerin görselleri"}>
          {collageRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid min-h-0 gap-0.5" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
              {row.map((post) => (
                <Link key={post.id} href={languageHref(`/haber/${post.id}`, language)} aria-label={post.title || (isEnglish ? "Open story" : "Haberi aç")} className="group relative min-w-0 overflow-hidden bg-surface-3">
                  {isOptimizableImage(post.cover_path)
                    ? <Image src={post.cover_path} alt="" fill sizes={row.length === 1 ? "(max-width: 640px) 100vw, 640px" : `(max-width: 640px) ${Math.ceil(100 / row.length)}vw, ${Math.ceil(640 / row.length)}px`} className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                    // eslint-disable-next-line @next/next/no-img-element -- source-discovered images may use official hosts outside the optimizer allow-list
                    : <img src={post.cover_path ?? ""} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {briefHeader}

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
