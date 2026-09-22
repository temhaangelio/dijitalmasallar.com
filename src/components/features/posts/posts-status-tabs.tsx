"use client";

import { ChevronDown } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import type { PostStatus } from "@/types/database";
export type PostStatusFilter = Extract<PostStatus, "published" | "scheduled" | "draft"> | "all";

export function PostsStatusTabs({ active, total, scheduledTotal, draftTotal, onChange }: {
  active: PostStatusFilter; total: number; scheduledTotal: number; draftTotal: number; onChange: (value: PostStatusFilter) => void;
}) {
  const filters = [
    { label: "Tümü", value: "all" as const, count: total },
    { label: "Yayında", value: "published" as const, count: Math.max(total - scheduledTotal - draftTotal, 0) },
    { label: "Taslaklar", value: "draft" as const, count: draftTotal },
    { label: "Planlı", value: "scheduled" as const, count: scheduledTotal },
  ];
  const selected = filters.find((filter) => filter.value === active) ?? filters[0];

  return <ActionMenu
    label={`Yazı durumu: ${selected.label} (${selected.count.toLocaleString("tr-TR")})`}
    trigger={<><span>{selected.label} ({selected.count.toLocaleString("tr-TR")})</span><ChevronDown size={16} aria-hidden="true" /></>}
    triggerClassName="flex h-11 w-auto min-w-0 sm:min-w-[190px] shrink-0 items-center justify-between gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold whitespace-nowrap tabular-nums text-ink-2 transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-ink"
    items={filters.map((filter) => ({
      label: `${filter.label} (${filter.count.toLocaleString("tr-TR")})`,
      checked: active === filter.value,
      onSelect: () => { if (active !== filter.value) onChange(filter.value); },
    }))}
  />;
}
