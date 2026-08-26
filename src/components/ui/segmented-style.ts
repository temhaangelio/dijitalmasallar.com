import { cn } from "@/lib/utils";

/**
 * The shared look of a segment, kept out of `segmented.tsx` on purpose.
 *
 * `Segmented` itself measures the DOM, so it is a Client Component — and a plain function exported
 * from a `"use client"` module cannot be called from the server at all, only rendered as a
 * component or passed as a prop. Server pages lay their own segments out as links, so the class
 * builder lives here where either side can reach it.
 *
 * The active colour is the pill's contrast rather than a background of its own: the pill is drawn
 * behind the segment by `Segmented`.
 */
export function segmentClassName(active: boolean) {
  return cn(
    "relative z-[1] flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
    active ? "text-ink-contrast" : "text-muted hover:text-ink",
  );
}
