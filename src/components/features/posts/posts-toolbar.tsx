"use client";

import { ArrowDownUp, Columns3, Search, X } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Input } from "@/components/ui/input";
import type { PostSort } from "@/services/posts";

export const columnLabels = { language: "Dil", category: "Kategori", status: "Durum", reads: "Okuma", date: "Tarih" } as const;
export type OptionalColumn = keyof typeof columnLabels;
export const sortLabels: Record<PostSort, string> = { newest: "En yeni", oldest: "En eski", "title-asc": "Başlık A–Z", "title-desc": "Başlık Z–A", "category-asc": "Kategori A–Z" };

const segment = "flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-wait";
const menuTrigger = "flex h-10 w-auto items-center gap-2 rounded-full bg-surface-3 px-4 text-sm font-semibold text-ink hover:bg-line";

export function PostsToolbar({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  languagePending,
  sort,
  onSortChange,
  visibleColumns,
  onToggleColumn,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  language: "tr" | "en";
  onLanguageChange: (value: "tr" | "en") => void;
  languagePending: boolean;
  sort: PostSort;
  onSortChange: (value: PostSort) => void;
  visibleColumns: Record<OptionalColumn, boolean>;
  onToggleColumn: (column: OptionalColumn) => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label="Yüklenen yazılarda ara"
          placeholder="Başlık, özet veya kategoride ara"
          className={query ? "px-11" : "pl-11"}
        />
        {query ? (
          <button type="button" onClick={() => onQueryChange("")} aria-label="Aramayı temizle" className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-ink">
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-surface-3 p-1" role="group" aria-label="Yazı dili">
          {(["tr", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={languagePending}
              aria-pressed={language === value}
              onClick={() => onLanguageChange(value)}
              className={`${segment} ${language === value ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
            >
              {value === "tr" ? "Türkçe" : "İngilizce"}
            </button>
          ))}
        </div>
        <ActionMenu
          label="Sütunları seç"
          placement="center"
          trigger={<><Columns3 size={15} aria-hidden="true" /><span>Sütunlar</span></>}
          triggerClassName={menuTrigger}
          items={(Object.keys(columnLabels) as OptionalColumn[]).map((column) => ({ label: columnLabels[column], checked: visibleColumns[column], keepOpen: true, onSelect: () => onToggleColumn(column) }))}
        />
        <ActionMenu
          label="Yazıları sırala"
          trigger={<><ArrowDownUp size={15} aria-hidden="true" /><span>Sırala · {sortLabels[sort]}</span></>}
          triggerClassName={menuTrigger}
          items={(Object.keys(sortLabels) as PostSort[]).map((value) => ({ label: sortLabels[value], checked: sort === value, onSelect: () => onSortChange(value) }))}
        />
      </div>
    </div>
  );
}
