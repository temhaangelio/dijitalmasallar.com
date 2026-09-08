"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** The side navigation asks for the brief with this event; the sheet lives in the feed. */
export const openBriefEvent = "visitor:open-brief";

/**
 * The brief as a sheet over the feed rather than a card at the top of it.
 *
 * As a card it was the first thing on the page and the tallest, and on wide screens it sat over a
 * grid that wanted to start at once. Now the feed opens with its first note, and the brief is a
 * click away: the ink tile in the left column on wide screens, a single row above the feed on
 * narrower ones, where there is no column to hold it.
 */
export function DailyBriefSheet({ language, title, date, dateLabel, count, children }: {
  language: VisitorLanguage;
  title: string;
  date: string;
  dateLabel: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEnglish = language === "en";
  const onOpenChange = useCallback((next: boolean) => setOpen(next), []);

  useEffect(() => {
    const listener = () => setOpen(true);
    window.addEventListener(openBriefEvent, listener);
    return () => window.removeEventListener(openBriefEvent, listener);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="visitor-brief-trigger group/brief mb-7 flex w-full items-center justify-between gap-3 rounded-[16px] border border-line px-5 py-4 text-left text-ink transition-colors hover:border-line-strong sm:mb-9 sm:px-6 xl:hidden"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="visitor-serif text-[20px] font-normal leading-7 tracking-[-.025em] sm:text-[22px]">{title}</span>
          <time dateTime={date} className="visitor-sans text-[11px] leading-5 text-muted">{dateLabel}</time>
        </span>
        <span className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="rounded-full border border-line px-2.5 py-1 whitespace-nowrap text-[12px] leading-5 text-muted"><span className="font-medium tabular-nums text-ink-2">{count}</span>{" "}{isEnglish ? "notes" : "not"}</span>
          <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-muted transition-colors duration-150 group-hover/brief:text-accent">
            <svg className="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7 5.5 11.5 10 7 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </button>

      <VisitorBottomSheet open={open} onOpenChange={onOpenChange} title={title} closeLabel={isEnglish ? "Close the brief" : "Özeti kapat"}>
        <time dateTime={date} className="visitor-sans block text-[11px] font-medium uppercase leading-5 tracking-[.16em] text-accent">{dateLabel}</time>
        {children}
      </VisitorBottomSheet>
    </>
  );
}
