"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAdAction, toggleAdAction, updateAdLanguageAction } from "@/app/(dashboard)/reklamlar/actions";
import { EmptyState } from "@/components/feedback/states";
import { ActionMenu } from "@/components/ui/action-menu";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
      try {
        const result = await action();
        showToast(result.message, result.success ? "success" : "error");
        if (result.success) router.refresh();
      } catch { showToast("İşlem tamamlanamadı. Lütfen tekrar deneyin.", "error"); }
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
          <Card key={ad.id} className="flex min-w-0 flex-col overflow-hidden !p-0">
            {ad.image_url && (
              <div className="relative aspect-[2/1] bg-surface-2">
                {isOptimizableImage(ad.image_url)
                  ? <Image src={ad.image_url} alt={ad.title} fill sizes="(max-width: 1023px) calc(100vw - 64px), 550px" className="object-contain" />
                  // eslint-disable-next-line @next/next/no-img-element -- external advertisement image
                  : <img src={ad.image_url} alt={ad.title} loading="lazy" decoding="async" className="absolute inset-0 size-full object-contain" />}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[12px] font-medium text-ink-2">
                  <span className={`size-1.5 rounded-full ${ad.active ? "bg-ink" : "bg-line-strong"}`} aria-hidden="true" />
                  {ad.active ? "Yayında" : "Duraklatıldı"}
                </span>
                <Switch checked={ad.active} disabled={pending} onCheckedChange={(checked) => runAction(() => toggleAdAction(ad.id, checked))} label={`${ad.title} reklamını yayınla`} />
              </div>
              <h2 className="font-[family-name:var(--font-source-serif)] text-[23px] font-medium leading-[1.3] tracking-[-.02em] text-ink">{ad.title}</h2>
              <p className="mt-3 text-[14px] leading-6 text-muted">{ad.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span className="rounded-md bg-surface-2 px-2 py-1">{ad.language === "tr" ? "Türkçe" : "English"}</span>
                <span>{ad.label}</span>
              </div>
              <div className="mt-auto pt-5">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3">
                  <a href={ad.target_url} target="_blank" rel="noopener noreferrer" title={ad.target_url} className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink">
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{hostname(ad.target_url).replace(/^www\./, "")}</span>
                  </a>
                  <div className="ml-auto flex items-center gap-1">
                    <Link href={`/reklamlar/${ad.id}/duzenle`} aria-label={`${ad.title} reklamını düzenle`} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                      <Pencil className="size-3.5" aria-hidden="true" />Düzenle
                    </Link>
                    <ActionMenu label={`${ad.title} reklamı işlemleri`} disabled={pending} triggerClassName="!size-11 disabled:opacity-40" items={[
                      { label: "Türkçe akışında göster", checked: ad.language === "tr", onSelect: () => { if (ad.language !== "tr") runAction(() => updateAdLanguageAction(ad.id, "tr")); } },
                      { label: "İngilizce akışında göster", checked: ad.language === "en", onSelect: () => { if (ad.language !== "en") runAction(() => updateAdLanguageAction(ad.id, "en")); } },
                      { label: "Reklamı sil", icon: <Trash2 size={15} aria-hidden="true" />, destructive: true, onSelect: () => setAdToDelete(ad) },
                    ]} />
                  </div>
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
