"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { deleteAdAction, toggleAdAction, updateAdLanguageAction } from "@/app/(dashboard)/reklamlar/actions";
import { EmptyState } from "@/components/feedback/states";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/toast";
import { isOptimizableImage } from "@/lib/images";
import type { Advertisement } from "@/services/ads";

function hostname(value: string) {
  try { return new URL(value).hostname; } catch { return value; }
}

export function AdsList({ ads }: { ads: Advertisement[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);

  function runAction(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) router.refresh();
    });
  }

  async function removeSelected() {
    if (!adToDelete) return false;
    const result = await deleteAdAction(adToDelete.id);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) router.refresh();
    return result.success;
  }

  if (!ads.length) {
    return (
      <Card>
        <EmptyState title="Henüz reklam yok" description="İlk reklamı ekleyin; ziyaretçi akışında yazıların arasında gösterilecek." />
        <div className="flex justify-center">
          <Link href="/reklamlar/yeni" className={buttonVariants()}><Plus className="size-4" aria-hidden="true" />Reklam ekle</Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        {ads.map((ad) => (
          <Card key={ad.id} className="flex flex-col overflow-hidden p-0">
            {ad.image_url && (
              <div className="relative h-44 bg-line">
                {isOptimizableImage(ad.image_url)
                  ? <Image src={ad.image_url} alt="" fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
                  // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
                  : <img src={ad.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={ad.active ? "solid" : "neutral"}>{ad.active ? "Yayında" : "Durduruldu"}</Badge>
                    <span className="text-xs font-semibold text-muted">{ad.label}</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-[-.03em]">{ad.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{ad.description}</p>
                </div>
                <Switch
                  checked={ad.active}
                  disabled={pending}
                  onCheckedChange={(checked) => runAction(() => toggleAdAction(ad.id, checked))}
                  label={`${ad.title} reklamını yayınla`}
                />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted hover:text-ink">
                  <ExternalLink className="size-4" aria-hidden="true" />{hostname(ad.target_url)}
                </a>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`${ad.title} reklam dili`}
                    value={ad.language}
                    disabled={pending}
                    onChange={(event) => runAction(() => updateAdLanguageAction(ad.id, event.target.value as "tr" | "en"))}
                    className="h-9 min-w-28"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </Select>
                  <button type="button" onClick={() => setAdToDelete(ad)} className="flex min-h-9 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-surface">
                    <Trash2 className="size-4" aria-hidden="true" />Sil
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(adToDelete)}
        title="Reklam silinsin mi?"
        description={adToDelete ? `“${adToDelete.title}” reklamı ve yüklenen görseli kalıcı olarak silinecek.` : "Bu işlem geri alınamaz."}
        confirmLabel="Reklamı sil"
        variant="destructive"
        onOpenChange={(open) => !open && setAdToDelete(null)}
        onConfirm={removeSelected}
      />
    </>
  );
}
