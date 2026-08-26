"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/ui/segmented";
import { segmentClassName } from "@/components/ui/segmented-style";
import { showToast } from "@/components/ui/toast";
import { approveAiItemAction, rejectAiItemAction, retryAiItemAction } from "@/app/(dashboard)/yapay-zeka/actions";
import type { AiItem } from "@/services/ai-desk";

/**
 * One story waiting on a verdict.
 *
 * The note is editable in place because the alternative — approve, then go find the post and fix
 * it — puts the model's wording live for however long that takes. What the editor sees here is
 * exactly what gets published, and the character counter is the same 400-character limit the
 * summariser was held to.
 */

const summaryLimit = 400;

function importanceLabel(value: number) {
  return ["", "Niş", "Düşük", "Orta", "Yüksek", "Gündem"][value] ?? "";
}

function publishedNote(value: string | null) {
  if (!value) return "tarih yok";
  const hours = Math.round((Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 1) return "az önce";
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} gün önce` : new Date(value).toLocaleDateString("tr-TR");
}

export function AiItemCard({ item, categories }: { item: AiItem; categories: readonly string[] }) {
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [titleTr, setTitleTr] = useState(item.titleTr);
  const [titleEn, setTitleEn] = useState(item.titleEn);
  const [summaryTr, setSummaryTr] = useState(item.summaryTr);
  const [summaryEn, setSummaryEn] = useState(item.summaryEn);
  const [category, setCategory] = useState(item.category || categories[0]);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const title = language === "tr" ? titleTr : titleEn;
  const summary = language === "tr" ? summaryTr : summaryEn;
  const setTitle = language === "tr" ? setTitleTr : setTitleEn;
  const setSummary = language === "tr" ? setSummaryTr : setSummaryEn;
  const remaining = summaryLimit - summary.length;

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) setDone(true);
    });
  }

  // The row leaves on its own rather than waiting for the revalidated page: a verdict that appears
  // to do nothing for a second invites a second click.
  if (done) return null;

  return (
    <article className="card flex flex-col gap-4 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline">{item.sourceName}</Badge>
          {item.importance > 0 && <Badge variant={item.importance >= 4 ? "solid" : "neutral"}>{importanceLabel(item.importance)}</Badge>}
          <span className="text-[13px] text-muted">{publishedNote(item.originalPublishedAt)}</span>
        </div>
        <Segmented role="group" label="Dil" className="shrink-0">
          {(["tr", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              data-active={language === code}
              onClick={() => setLanguage(code)}
              className={segmentClassName(language === code)}
            >
              {code === "tr" ? "Türkçe" : "English"}
            </button>
          ))}
        </Segmented>
      </header>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex items-start gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <span className="line-clamp-1">{item.originalTitle || item.url}</span>
        <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      </a>

      <div className="flex flex-col gap-3">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label={language === "tr" ? "Türkçe başlık" : "İngilizce başlık"}
          placeholder="Başlık"
          maxLength={120}
        />
        <div>
          <Textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            aria-label={language === "tr" ? "Türkçe özet" : "İngilizce özet"}
            placeholder="Özet"
            rows={4}
          />
          <p className={`mt-1.5 text-right text-[12px] font-medium ${remaining < 0 ? "text-danger" : "text-muted"}`}>
            {remaining < 0 ? `${-remaining} karakter fazla` : `${remaining} karakter kaldı`}
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`category-${item.id}`}>Kategori</label>
          <select
            id={`category-${item.id}`}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-9 rounded-full border border-line-strong bg-surface px-3 text-[13px] font-semibold text-ink"
          >
            {[...new Set([category, ...categories])].filter(Boolean).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {item.model && <span className="text-[12px] text-muted">{item.model}</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => run(() => rejectAiItemAction(item.id))}
          >
            <X className="size-4" aria-hidden="true" /> Reddet
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || remaining < 0 || !title.trim() || !summary.trim()}
            onClick={() => run(() => approveAiItemAction(item.id, { titleTr, titleEn, summaryTr, summaryEn, category }))}
          >
            <Check className="size-4" aria-hidden="true" /> Yayınla
          </Button>
        </div>
      </footer>
    </article>
  );
}

/** Rejected, skipped and failed rows: read-only, with the one action that makes sense on them. */
export function AiItemRow({ item, note, retryable }: { item: AiItem; note: string; retryable: boolean }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return null;

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="line-clamp-1 text-[14px] font-semibold text-ink hover:underline">
          {item.titleTr || item.originalTitle || item.url}
        </a>
        <p className="mt-1 line-clamp-2 text-[13px] text-muted">{item.sourceName} · {note}</p>
      </div>
      {retryable && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const result = await retryAiItemAction(item.id);
            showToast(result.message, result.success ? "success" : "error");
            if (result.success) setDone(true);
          })}
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Tekrar dene
        </Button>
      )}
    </div>
  );
}
