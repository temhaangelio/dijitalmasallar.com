"use client";

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
  return <div role="group" aria-label="Yazı durumu" className="mb-4 inline-flex gap-1 rounded-full bg-surface-2 p-1">
    {filters.map(filter => <button key={filter.value} type="button" aria-pressed={active === filter.value} onClick={() => { if (active !== filter.value) onChange(filter.value); }} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${active === filter.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
      {filter.label}<span className="text-[11px] font-medium tabular-nums text-muted">{filter.count.toLocaleString("tr-TR")}</span>
    </button>)}
  </div>;
}
