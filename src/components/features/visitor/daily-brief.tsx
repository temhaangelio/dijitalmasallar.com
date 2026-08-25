"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import type { VisitorLanguage } from "@/lib/visitor-language";

/**
 * The day in one paragraph, written out of the notes published that day — the feed's own words, not
 * generated copy. Only the first lines are shown; the rest is one press away, so the brief cannot
 * push the timeline off the first screen.
 *
 * It sits directly on the canvas rather than in a panel: it is the opening of the page, not another
 * card in the stack, and the cards below should be the first bordered thing a reader sees.
 *
 * The whole paragraph is in the HTML either way, clamped by CSS rather than cut in JavaScript, so a
 * reader without the toggle — a crawler, a reader mode, anyone who copies the text — still gets all
 * of it.
 */
export function DailyBrief({ text, sentenceCount, language, latestTime }: { text: string; sentenceCount: number; language: VisitorLanguage; latestTime?: string }) {
  const [expanded, setExpanded] = useState(false);
  const paragraphId = useId();
  const headingId = useId();
  if (!text) return null;
  const isEnglish = language === "en";

  return (
    // Full-bleed: the wash behind the brief runs to both edges of the window while the text stays
    // in the same 720px column as everything else.
    <section className="daily-brief -mx-5 w-[calc(100%+2.5rem)] px-5" aria-labelledby={headingId}>
      <div className="mx-auto w-full max-w-[720px] px-1 pb-9 pt-12 sm:pb-11 sm:pt-16">
        {/*
          The page's own heading, kept at the size of a section title rather than a display line: the
          brief underneath it is what the reader came for. No dateline of its own either — the feed's
          first day separator sits a few lines below and already names the day.
        */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 id={headingId} className="visitor-heading text-[length:var(--vt-h4)] font-semibold tracking-[-.025em] text-ink">
            {isEnglish ? "Today’s Brief" : "Günün Özeti"}
          </h1>
          {/* The day is not over: notes keep arriving, and the brief grows with them. The stamp is
              formatted on the server so the two renders cannot disagree about the reader's clock. */}
          {latestTime ? (
            <span className="visitor-muted inline-flex min-h-8 items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[length:var(--vt-meta)] font-semibold text-muted shadow-[0_2px_8px_rgba(0,0,0,.05)]">
              <span className="relative flex size-2 items-center justify-center" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-ink/45 motion-safe:animate-ping" />
                <span className="relative size-2 rounded-full bg-ink" />
              </span>
              {isEnglish ? `Still unfolding · last note ${latestTime}` : `Gün sürüyor · son not ${latestTime}`}
            </span>
          ) : null}
        </div>
        <p
          id={paragraphId}
          className={`visitor-copy mt-4 text-[length:var(--vt-lead)] font-normal leading-[1.75] tracking-[-.018em] text-ink [text-wrap:pretty] ${expanded ? "" : "line-clamp-3"}`}
        >
          {text}
        </p>
        {sentenceCount > 1 ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={paragraphId}
            // No pill, no border, no rule: the toggle is part of the sentence flow, set in the
            // paragraph's own type, and only its weight and the chevron mark it as pressable.
            className="visitor-copy mt-3 inline-flex items-center gap-1 text-[length:var(--vt-small)] font-semibold text-muted transition-colors hover:text-ink"
          >
            {expanded ? (isEnglish ? "Less" : "Daha az") : (isEnglish ? "More" : "Devamı")}
            <ChevronDown size={15} aria-hidden="true" className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
