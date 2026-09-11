"use client";

import { ArrowDownUp, LoaderCircle, Search, X } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Input } from "@/components/ui/input";
import type { PostSort } from "@/services/posts";
import { PostsStatusTabs, segmentClass, segmentGroupClass, type PostStatusFilter } from "./posts-status-tabs";

export const sortLabels: Record<PostSort, string> = { newest: "En yeni", oldest: "En eski", "title-asc": "Başlık A–Z", "title-desc": "Başlık Z–A" };

/**
 * Everything that narrows the list, in two rows on a phone and one on a wide screen.
 *
 * The search field is what gets used most, so it comes first and takes the width; the filters
 * scroll sideways on a phone rather than stacking into a third row above the first title. The sort
 * keeps its label from `sm` up and is an icon alone below it.
 */
export function PostsToolbar({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  pendingLanguage,
  sort,
  onSortChange,
  status,
  onStatusChange,
  total,
  scheduledTotal,
  resultTotal,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  language: "tr" | "en";
  onLanguageChange: (value: "tr" | "en") => void;
  pendingLanguage: "tr" | "en" | null;
  sort: PostSort;
  onSortChange: (value: PostSort) => void;
  status: PostStatusFilter;
  onStatusChange: (value: PostStatusFilter) => void;
  total: number;
  scheduledTotal: number;
  resultTotal: number;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2 lg:order-2 lg:min-w-0 lg:flex-1">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            type="search"
            role="searchbox"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Tüm yazılarda ara"
            placeholder="Yazılarda ara"
            className={`h-11 [&::-webkit-search-cancel-button]:hidden ${query ? "pl-11 pr-12" : "pl-11"}`}
          />
          {query ? (
            <button type="button" onClick={() => onQueryChange("")} aria-label="Aramayı temizle" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-ink">
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <ActionMenu
          label="Yazıları sırala"
          trigger={<><ArrowDownUp size={16} aria-hidden="true" /><span className="hidden sm:inline">{sortLabels[sort]}</span></>}
          triggerClassName="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-surface px-0 text-[13px] font-semibold whitespace-nowrap text-ink-2 transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-ink sm:w-auto sm:px-4"
          items={(Object.keys(sortLabels) as PostSort[]).map((value) => ({ label: sortLabels[value], checked: sort === value, onSelect: () => onSortChange(value) }))}
        />
      </div>
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:order-1 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        <PostsStatusTabs active={status} total={total} scheduledTotal={scheduledTotal} onChange={onStatusChange} />
        <div className={segmentGroupClass} role="group" aria-label="Yazı dili">
          {(["tr", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={pendingLanguage !== null}
              aria-pressed={language === value}
              onClick={() => onLanguageChange(value)}
              className={segmentClass(language === value, pendingLanguage !== null)}
            >
              {pendingLanguage === value ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {value === "tr" ? "Türkçe" : "İngilizce"}
            </button>
          ))}
        </div>
      </div>
      <p className="hidden shrink-0 text-sm font-medium tabular-nums text-muted lg:order-3 lg:block" aria-live="polite">{resultTotal.toLocaleString("tr-TR")} sonuç</p>
    </div>
  );
}
