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
  return <div role="group" aria-label="Yazı durumu" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 scrollbar-none">
    {filters.map(filter => <button key={filter.value} type="button" aria-pressed={active === filter.value} onClick={() => { if (active !== filter.value) onChange(filter.value); }} className={`inline-flex min-h-11 flex-none items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition-[color,background-color,box-shadow] ${active === filter.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:bg-surface/60 hover:text-ink"}`}>
      {filter.label}<span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${active === filter.value ? "bg-surface-3 text-ink-2" : "text-muted"}`}>{filter.count.toLocaleString("tr-TR")}</span>
    </button>)}
  </div>;
}
