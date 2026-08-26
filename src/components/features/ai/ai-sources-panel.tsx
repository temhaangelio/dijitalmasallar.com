"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import { addAiSourceAction, removeAiSourceAction, toggleAiSourceAction } from "@/app/(dashboard)/yapay-zeka/actions";
import type { AiSource } from "@/services/ai-desk";

const kindLabels: Record<AiSource["kind"], string> = {
  feed: "Akış",
  sitemap: "Site haritası",
  page: "Sayfa taraması",
};

function fetchNote(value: string | null) {
  if (!value) return "henüz taranmadı";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "az önce tarandı";
  if (minutes < 60) return `${minutes} dk önce tarandı`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} saat önce tarandı` : `${Math.round(hours / 24)} gün önce tarandı`;
}

export function AiSourcesPanel({ sources, categories }: { sources: AiSource[]; categories: readonly string[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [adding, startAdding] = useTransition();
  const [removing, setRemoving] = useState<AiSource | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData();
    form.set("url", url);
    form.set("category", category);
    startAdding(async () => {
      const result = await addAiSourceAction(form);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) {
        setUrl("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="card flex flex-wrap items-center gap-3 p-4">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          type="url"
          required
          placeholder="https://openai.com/news"
          aria-label="Resmi kaynak adresi"
          className="min-w-[240px] flex-1"
        />
        <label className="sr-only" htmlFor="new-source-category">Kategori</label>
        <select
          id="new-source-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-12 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink"
        >
          {categories.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <Button type="submit" disabled={adding || !url.trim()}>
          <Plus className="size-4" aria-hidden="true" /> {adding ? "Deneniyor…" : "Ekle"}
        </Button>
      </form>

      {/* Adding a source proves it can be read, which is why the form can take a minute. */}
      <p className="text-[13px] text-muted">
        Adres eklenirken sırayla RSS akışı, site haritası ve sayfa taraması denenir; hiçbiri tutmazsa kaynak eklenmez.
        Haber bağlantıları yalnızca kaynağın kendi alan adından kabul edilir.
      </p>

      {sources.length === 0 ? (
        <div className="card p-8 text-center text-[14px] text-muted">Henüz kaynak eklenmedi.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((source) => (
            <li key={source.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={source.siteUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-ink hover:underline">
                    {source.name}
                  </a>
                  <Badge variant="neutral">{kindLabels[source.kind]}</Badge>
                  <Badge variant="outline">{source.category}</Badge>
                  {source.pendingCount > 0 && <Badge variant="solid">{source.pendingCount} bekliyor</Badge>}
                </div>
                <p className="mt-1 truncate text-[13px] text-muted">{fetchNote(source.lastFetchedAt)}</p>
                {source.lastError && (
                  <p className="mt-1 flex items-start gap-1.5 text-[13px] text-danger">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-2">{source.lastError}</span>
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Switch
                  label={`${source.name} kaynağını takip et`}
                  checked={source.active}
                  onCheckedChange={async (value) => {
                    const result = await toggleAiSourceAction(source.id, value);
                    showToast(result.message, result.success ? "success" : "error");
                    router.refresh();
                  }}
                />
                <Button type="button" variant="ghost" size="sm" aria-label={`${source.name} kaynağını sil`} onClick={() => setRemoving(source)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Kaynağı sil"
        description={`“${removing?.name ?? ""}” ve bu kaynaktan gelen tüm içerikler silinecek. Yayınlanmış haberler etkilenmez.`}
        confirmLabel="Sil"
        variant="destructive"
        onOpenChange={(open) => !open && setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          const result = await removeAiSourceAction(removing.id);
          showToast(result.message, result.success ? "success" : "error");
          setRemoving(null);
          router.refresh();
        }}
      />
    </div>
  );
}
