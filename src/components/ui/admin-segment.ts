/**
 * The shared look of every segmented control in the panel: a light pill with a hairline marks the
 * choice, the way the public site's navigation marks the page you are on.
 *
 * Deliberately **not** a `"use client"` module. A plain function or constant exported from one
 * becomes a client reference: a Server Component cannot call it or read it, only render it as a
 * component or pass it as a prop. `/gunun-ozeti` lays its language segments out as links on the
 * server, so the style has to live where either side can reach it — the same reason
 * `segmented-style.ts` exists for the visitor side.
 */
export const segmentGroupClass = "flex max-w-full shrink-0 gap-1 rounded-full bg-surface-2 p-1";

export function segmentClass(active: boolean, disabled = false) {
  return `inline-flex min-h-10 flex-none items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[color,background-color,box-shadow] ${active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"} ${disabled ? "cursor-wait" : ""}`;
}
