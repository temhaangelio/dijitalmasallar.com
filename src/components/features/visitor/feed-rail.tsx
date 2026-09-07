"use client";

import { useEffect, useState } from "react";

export type FeedRailDay = { key: string; label: string; fullLabel: string; items: { id: string; time: string; title: string }[] };

/**
 * The day index that stands in the right margin on wide screens.
 *
 * The feed is one continuous stretch of a few thousand pixels, and until now the only way through it
 * was the scrollbar: nothing said which day you were in, and getting back to this morning meant
 * dragging and guessing. The margin was empty, so the map goes there.
 *
 * Deliberately not a second reading column — widening the text was the other way to spend that
 * space, and 640px is where the measure should stay. This is navigation, and it stays out of the
 * way: hairline spine, times in the quiet grey, only the note you are on picked out.
 *
 * Server-rendered links first, so it works with no JavaScript and needs no layout measurement; the
 * only thing the client adds is which entry is lit.
 */
export function FeedRail({ days, label }: { days: FeedRailDay[]; label: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);

  /*
   * Why this is not `position: sticky`.
   *
   * Sticky is trapped inside its own container, and the rail's container is the feed. Near the end
   * of the last note the container's bottom arrives, sticky lets go, and the rail slides off the
   * screen while there is still a note to read — which is exactly where the index stopped following
   * the page. So it does the two states itself: it sits in the flow beside the daily brief until the
   * feed's top passes the line, then pins to the window and stays there to the end of the page.
   */
  useEffect(() => {
    const column = document.querySelector("main");
    if (!column) return;
    const update = () => setPinned(column.getBoundingClientRect().top <= 88);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const targets = days.flatMap((day) => day.items.map((item) => document.getElementById(item.id))).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;

    /*
     * The lit entry is the last note whose top has passed the reading line — a band a third of the
     * way down the window — rather than "whatever is intersecting", which flickers between two
     * neighbours whenever both are on screen at once.
     */
    const visible = new Set<Element>();
    const pick = () => {
      const line = window.innerHeight / 3;
      let current: HTMLElement | null = null;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) current = target;
        else break;
      }
      setActiveId((current ?? targets[0]).id);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      pick();
    }, { rootMargin: "-33% 0px -60% 0px", threshold: 0 });

    targets.forEach((target) => observer.observe(target));
    // The observer alone goes quiet between notes — a tall note can hold the reading line for a
    // whole screen of scrolling — so the scroll itself keeps the choice honest.
    window.addEventListener("scroll", pick, { passive: true });
    pick();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pick);
    };
  }, [days]);

  return (
    <nav aria-label={label} className="visitor-rail" data-pinned={pinned ? "true" : "false"}>
      <div className="visitor-rail-inner">
        {days.map((day) => (
          <div key={day.key} className="visitor-rail-day">
            <span className="visitor-rail-date" title={day.fullLabel}>{day.label}</span>
            <ul>
              {day.items.map((item) => {
                const current = item.id === activeId;
                return (
                  <li key={item.id}>
                    <a href={`#${item.id}`} title={item.title} aria-current={current ? "true" : undefined} className="visitor-rail-link">
                      <span className="visitor-rail-time">{item.time}</span>
                      <span className="visitor-rail-title">{item.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
