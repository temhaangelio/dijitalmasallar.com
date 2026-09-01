"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createAdAction, updateAdAction } from "@/app/(dashboard)/reklamlar/actions";
import { FileUpload } from "@/components/forms/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import { isOptimizableImage } from "@/lib/images";
import type { Advertisement } from "@/services/ads";

export function AdForm({ ad }: { ad?: Advertisement }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [active, setActive] = useState(ad?.active ?? true);
  const [removeImage, setRemoveImage] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("active", String(active));
    formData.set("removeImage", String(removeImage));
    if (image) formData.set("image", image);
    startTransition(async () => {
      const result = ad ? await updateAdAction(ad.id, formData) : await createAdAction(formData);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) {
        router.push("/reklamlar");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="card space-y-5">
        <div>
          <h2 className="section-title">Reklam içeriği</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Reklam, ziyaretçi akışında yazıların arasında rastgele gösterilir.</p>
        </div>

        <FormField label="Başlık" htmlFor="ad-title">
          <Input id="ad-title" name="title" defaultValue={ad?.title} minLength={3} maxLength={100} required />
        </FormField>

        <FormField label="Açıklama" htmlFor="ad-description">
          <Textarea id="ad-description" name="description" defaultValue={ad?.description} minLength={10} maxLength={240} required />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Buton metni" htmlFor="ad-cta">
            <Input id="ad-cta" name="ctaLabel" defaultValue={ad?.cta_label ?? "Keşfet"} minLength={2} maxLength={30} required />
          </FormField>
          <FormField label="Hedef adres" htmlFor="ad-url">
            <Input id="ad-url" name="targetUrl" type="url" defaultValue={ad?.target_url} placeholder="https://" required />
          </FormField>
        </div>

        <FormField label="Gösterileceği dil" htmlFor="ad-language" hint="Reklam yalnızca seçilen dildeki ziyaretçi akışında gösterilir.">
          <Select id="ad-language" name="language" defaultValue={ad?.language ?? "tr"}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </Select>
        </FormField>

        <FormField label="Reklam görseli" htmlFor="ad-image" hint="İsteğe bağlı · JPG, PNG veya WebP · en fazla 5 MB">
          {ad?.image_url && !removeImage && !image ? <div className="mb-3 overflow-hidden rounded-field bg-surface-2">
            <div className="relative h-44">
              {isOptimizableImage(ad.image_url)
                ? <Image src={ad.image_url} alt="Mevcut reklam görseli" fill sizes="640px" className="object-cover" />
                // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
                : <img src={ad.image_url} alt="Mevcut reklam görseli" className="absolute inset-0 size-full object-cover" />}
            </div>
            <button type="button" onClick={() => setRemoveImage(true)} className="w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-danger-surface">Mevcut görseli kaldır</button>
          </div> : null}
          <FileUpload onChange={(file) => { setImage(file); if (file) setRemoveImage(false); }} label={ad?.image_url && !removeImage ? "Reklam görselini değiştir" : "Reklam görseli seç"} />
          {removeImage && !image ? <button type="button" onClick={() => setRemoveImage(false)} className="mt-2 text-xs font-semibold text-muted hover:text-ink">Mevcut görseli geri getir</button> : null}
        </FormField>

        <div className="flex items-center justify-between gap-4 rounded-field bg-surface-2 p-4">
          <div>
            <strong className="block text-sm">Hemen yayınla</strong>
            <small className="mt-1 block text-muted">Kapatırsanız reklam taslak olarak saklanır.</small>
          </div>
          <Switch checked={active} onCheckedChange={setActive} label="Reklamı hemen yayınla" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/reklamlar" className={buttonVariants({ variant: "secondary" })}>Vazgeç</Link>
        <Button type="submit" disabled={pending}>{pending ? (ad ? "Güncelleniyor…" : "Kaydediliyor…") : (ad ? "Değişiklikleri kaydet" : "Reklamı ekle")}</Button>
      </div>
    </form>
  );
}
