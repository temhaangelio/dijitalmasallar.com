"use client";

import type { PostStatus } from "@/types/database";
export type PostStatusFilter = Extract<PostStatus, "published" | "scheduled"> | "all";

/** The shared look of every segmented control in the panel: a light pill with a hairline marks the choice. */
export const segmentGroupClass = "flex max-w-full shrink-0 gap-1 rounded-full bg-surface-2 p-1";
export const segmentClass = (active: boolean, disabled = false) =>
  `inline-flex min-h-10 flex-none items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[color,background-color,box-shadow] ${active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"} ${disabled ? "cursor-wait" : ""}`;

export function PostsStatusTabs({ active, total, scheduledTotal, onChange }: {
  active: PostStatusFilter; total: number; scheduledTotal: number; onChange: (value: PostStatusFilter) => void;
}) {
  const filters = [
    { label: "Tümü", value: "all" as const, count: total },
    { label: "Yayında", value: "published" as const, count: Math.max(total - scheduledTotal, 0) },
    { label: "Planlı", value: "scheduled" as const, count: scheduledTotal },
  ];
  return <div role="group" aria-label="Yazı durumu" className={segmentGroupClass}>
    {filters.map(filter => <button key={filter.value} type="button" aria-pressed={active === filter.value} onClick={() => { if (active !== filter.value) onChange(filter.value); }} className={segmentClass(active === filter.value)}>
      {filter.label}<span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${active === filter.value ? "bg-surface-3 text-ink-2" : "text-faint"}`}>{filter.count.toLocaleString("tr-TR")}</span>
    </button>)}
  </div>;
}
