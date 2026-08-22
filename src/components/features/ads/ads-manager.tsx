"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { createAdAction, deleteAdAction, toggleAdAction, updateAdLanguageAction } from "@/app/(dashboard)/reklamlar/actions";
import { FileUpload } from "@/components/forms/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Advertisement } from "@/services/ads";

function hostname(value: string) { try { return new URL(value).hostname; } catch { return value; } }

export function AdsManager({ ads }: { ads: Advertisement[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [active, setActive] = useState(true);
  const [uploadKey, setUploadKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("active", String(active));
    if (image) formData.set("image", image);
    startTransition(async () => {
      const result = await createAdAction(formData);
      setMessage(result.message);
      if (result.success) {
        form.reset(); setImage(null); setActive(true); setUploadKey((value) => value + 1); router.refresh();
      }
    });
  }

  function toggle(ad: Advertisement, checked: boolean) {
    startTransition(async () => { const result = await toggleAdAction(ad.id, checked); setMessage(result.message); if (result.success) router.refresh(); });
  }

  function updateLanguage(ad: Advertisement, language: "tr" | "en") {
    startTransition(async () => { const result = await updateAdLanguageAction(ad.id, language); setMessage(result.message); if (result.success) router.refresh(); });
  }

  async function removeSelected() {
    if (!adToDelete) return false;
    const result = await deleteAdAction(adToDelete.id);
    setMessage(result.message);
    if (result.success) router.refresh();
    return result.success;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-12">
      <Card className="h-fit xl:col-span-5">
        <h2 className="section-title">Yeni reklam</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#a1a1a1]">Reklam ziyaretçi akışında yazıların arasında rastgele gösterilir.</p>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <FormField label="Başlık" htmlFor="ad-title"><Input id="ad-title" name="title" minLength={3} maxLength={100} required /></FormField>
          <FormField label="Açıklama" htmlFor="ad-description"><Textarea id="ad-description" name="description" minLength={10} maxLength={240} required /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Buton metni" htmlFor="ad-cta"><Input id="ad-cta" name="ctaLabel" defaultValue="Keşfet" minLength={2} maxLength={30} required /></FormField>
            <FormField label="Hedef adres" htmlFor="ad-url"><Input id="ad-url" name="targetUrl" type="url" placeholder="https://" required /></FormField>
          </div>
          <FormField label="Gösterileceği dil" htmlFor="ad-language" hint="Reklam yalnızca seçilen dildeki ziyaretçi akışında gösterilir."><Select id="ad-language" name="language" defaultValue="tr"><option value="tr">Türkçe</option><option value="en">English</option></Select></FormField>
          <FormField label="Reklam görseli" htmlFor="ad-image" hint="İsteğe bağlı · JPG, PNG veya WebP · en fazla 5 MB"><FileUpload key={uploadKey} onChange={setImage} label="Reklam görseli seç" /></FormField>
          <div className="flex items-center justify-between rounded-2xl bg-[#f7f7f7] p-4"><div><strong className="block text-sm">Hemen yayınla</strong><small className="mt-1 block text-[#a1a1a1]">Kapatırsanız reklam taslak olarak saklanır.</small></div><Switch checked={active} onCheckedChange={setActive} label="Reklamı hemen yayınla" /></div>
          {message && <p aria-live="polite" className="rounded-2xl bg-[#f5f5f5] p-3 text-sm">{message}</p>}
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Kaydediliyor…" : "Reklamı ekle"}</Button>
        </form>
      </Card>

      <div className="space-y-4 xl:col-span-7">
        <div className="flex items-center justify-between px-1"><h2 className="section-title">Reklamlar</h2><span className="text-sm text-[#a1a1a1]">{ads.length} kayıt</span></div>
        {ads.length ? ads.map((ad) => (
          <Card key={ad.id} className="overflow-hidden p-0">
            {ad.image_url && <div className="h-44 bg-[#e9e9e9] bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(ad.image_url)})` }} />}
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><Badge className={ad.active ? "bg-black !text-white" : ""}>{ad.active ? "Yayında" : "Durduruldu"}</Badge><span className="text-xs font-semibold text-[#a1a1a1]">{ad.label}</span></div><h3 className="text-xl font-bold tracking-[-.03em]">{ad.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#777]">{ad.description}</p></div>
                <Switch checked={ad.active} onCheckedChange={(checked) => toggle(ad, checked)} label={`${ad.title} reklamını yayınla`} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f1f1] pt-4"><a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-[#777] hover:text-black"><ExternalLink className="size-4" />{hostname(ad.target_url)}</a><div className="flex items-center gap-2"><Select aria-label={`${ad.title} reklam dili`} value={ad.language} disabled={pending} onChange={(event) => updateLanguage(ad, event.target.value as "tr" | "en")} className="h-9 min-w-28"><option value="tr">Türkçe</option><option value="en">English</option></Select><button type="button" onClick={() => setAdToDelete(ad)} className="flex items-center gap-1.5 text-sm font-semibold text-[#b42318]"><Trash2 className="size-4" />Sil</button></div></div>
            </div>
          </Card>
        )) : <Card className="grid min-h-48 place-items-center text-center"><div><strong>Henüz reklam yok</strong><p className="mt-1 text-sm text-[#a1a1a1]">İlk reklamı soldaki formdan ekleyin.</p></div></Card>}
      </div>

      <ConfirmDialog open={Boolean(adToDelete)} title="Reklam silinsin mi?" description={adToDelete ? `“${adToDelete.title}” reklamı ve yüklenen görseli kalıcı olarak silinecek.` : "Bu işlem geri alınamaz."} confirmLabel="Reklamı sil" variant="destructive" onOpenChange={(open) => !open && setAdToDelete(null)} onConfirm={removeSelected} />
    </div>
  );
}
