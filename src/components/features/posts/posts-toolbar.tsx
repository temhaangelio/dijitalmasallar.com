"use client";

import { ArrowDownUp, LoaderCircle, Search, X } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Input } from "@/components/ui/input";
import type { PostSort } from "@/services/posts";

export const sortLabels: Record<PostSort, string> = { newest: "En yeni", oldest: "En eski", "title-asc": "Başlık A–Z", "title-desc": "Başlık Z–A" };

const segment = "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-wait";
const menuTrigger = "flex min-h-11 w-auto items-center gap-2 rounded-full bg-surface-3 px-4 text-sm font-semibold text-ink hover:bg-line";

export function PostsToolbar({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  pendingLanguage,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  language: "tr" | "en";
  onLanguageChange: (value: "tr" | "en") => void;
  pendingLanguage: "tr" | "en" | null;
  sort: PostSort;
  onSortChange: (value: PostSort) => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-md flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input
          type="text"
          role="searchbox"
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label="Tüm yazılarda ara"
          placeholder="Tüm yazılarda ara"
          className={query ? "px-11" : "pl-11"}
        />
        {query ? (
          <button type="button" onClick={() => onQueryChange("")} aria-label="Aramayı temizle" className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-ink">
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
              disabled={pendingLanguage !== null}
              aria-pressed={language === value}
              onClick={() => onLanguageChange(value)}
              className={`${segment} ${language === value ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
            >
              {pendingLanguage === value ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {value === "tr" ? "Türkçe" : "İngilizce"}
            </button>
          ))}
        </div>
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
