"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Rect = { left: number; width: number };

/**
 * Draws a pill behind whichever child carries `data-active="true"` and slides it when the active
 * child changes. The position is measured rather than computed, so the segments do not have to be
 * equal width.
 *
 * The children keep their own semantics — buttons for a local choice, links for navigation — and
 * only need `data-active` plus a transparent background.
 */
export function Segmented({ children, className, role, label }: { children: ReactNode; className?: string; role?: "radiogroup" | "group" | "tablist"; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  // Skips the entry animation so the pill does not fly in from the left on first paint.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Measured from the DOM, so this cannot be derived state; it is read inside a callback rather
    // than straight from the effect body.
    const measure = () => {
      const active = container.querySelector<HTMLElement>('[data-active="true"]');
      setRect(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
      setSettled(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const child of container.children) observer.observe(child);

    const mutations = new MutationObserver(measure);
    mutations.observe(container, { attributes: true, attributeFilter: ["data-active"], subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [children]);

  return (
    <div ref={containerRef} role={role} aria-label={label} className={cn("relative flex gap-1 rounded-full bg-surface-2 p-1", className)}>
      {rect ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-1 rounded-full bg-ink",
            settled && "transition-[left,width] duration-300 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none",
          )}
          style={{ left: rect.left, width: rect.width }}
        />
      ) : null}
      {children}
    </div>
  );
}

/** Shared look for a segment. The active colour is the pill's contrast, not a background of its own. */
export function segmentClassName(active: boolean) {
  return cn(
    "relative z-[1] flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
    active ? "text-ink-contrast" : "text-muted hover:text-ink",
  );
}
