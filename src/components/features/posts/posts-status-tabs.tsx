"use client";

import { segmentClass, segmentGroupClass } from "@/components/ui/admin-segment";
import type { PostStatus } from "@/types/database";
export type PostStatusFilter = Extract<PostStatus, "published" | "scheduled"> | "all";

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
