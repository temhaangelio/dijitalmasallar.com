"use client";

import type { PostStatus } from "@/types/database";

export type PostStatusFilter = Extract<PostStatus, "published" | "scheduled"> | "all";

/**
 * A post's status is derived from `created_at`, so only "published" and "scheduled" can ever occur.
 * The counts come from the server total rather than the loaded page, which previously made every
 * tab except "Tümü" under-report as soon as the list was paginated.
 */
export function PostsStatusTabs({
  active,
  total,
  scheduledTotal,
  onChange,
}: {
  active: PostStatusFilter;
  total: number;
  scheduledTotal: number;
  onChange: (value: PostStatusFilter) => void;
}) {
  const tabs: { label: string; value: PostStatusFilter; count: number }[] = [
    { label: "Tümü", value: "all", count: total },
    { label: "Yayında", value: "published", count: Math.max(total - scheduledTotal, 0) },
    { label: "Planlı", value: "scheduled", count: scheduledTotal },
  ];

  return (
    <div role="tablist" aria-label="Yazı durumu" className="mb-5 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:mb-4 xl:gap-4">
      {tabs.map((tab) => {
        const selected = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`flex h-[132px] flex-col justify-between rounded-card p-6 text-left transition-colors xl:h-24 xl:p-5 ${selected ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-2"}`}
          >
            <span className={`text-[15px] font-semibold ${selected ? "text-white" : "text-ink-2"}`}>{tab.label}</span>
            <span className="text-[44px] font-bold leading-none tracking-[-.05em] tabular-nums xl:text-[34px]">{tab.count.toLocaleString("tr-TR")}</span>
          </button>
        );
      })}
    </div>
  );
}
