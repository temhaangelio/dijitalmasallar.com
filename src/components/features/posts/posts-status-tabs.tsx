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
  return <div role="group" aria-label="Yazı durumu" className="mb-5 flex flex-wrap gap-2">
    {filters.map(filter => <button key={filter.value} type="button" aria-pressed={active === filter.value} onClick={() => { if (active !== filter.value) onChange(filter.value); }} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors ${active === filter.value ? "bg-ink text-white" : "bg-surface-2 text-ink-2 hover:bg-surface-3"}`}>
      {filter.label}<span className={`text-xs tabular-nums ${active === filter.value ? "text-white/75" : "text-muted"}`}>{filter.count.toLocaleString("tr-TR")}</span>
    </button>)}
  </div>;
}
