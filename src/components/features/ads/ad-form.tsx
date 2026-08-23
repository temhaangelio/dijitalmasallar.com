"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createAdAction } from "@/app/(dashboard)/reklamlar/actions";
import { FileUpload } from "@/components/forms/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";

export function AdForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [active, setActive] = useState(true);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("active", String(active));
    if (image) formData.set("image", image);
    startTransition(async () => {
      const result = await createAdAction(formData);
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
          <Input id="ad-title" name="title" minLength={3} maxLength={100} required />
        </FormField>

        <FormField label="Açıklama" htmlFor="ad-description">
          <Textarea id="ad-description" name="description" minLength={10} maxLength={240} required />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Buton metni" htmlFor="ad-cta">
            <Input id="ad-cta" name="ctaLabel" defaultValue="Keşfet" minLength={2} maxLength={30} required />
          </FormField>
          <FormField label="Hedef adres" htmlFor="ad-url">
            <Input id="ad-url" name="targetUrl" type="url" placeholder="https://" required />
          </FormField>
        </div>

        <FormField label="Gösterileceği dil" htmlFor="ad-language" hint="Reklam yalnızca seçilen dildeki ziyaretçi akışında gösterilir.">
          <Select id="ad-language" name="language" defaultValue="tr">
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </Select>
        </FormField>

        <FormField label="Reklam görseli" htmlFor="ad-image" hint="İsteğe bağlı · JPG, PNG veya WebP · en fazla 5 MB">
          <FileUpload onChange={setImage} label="Reklam görseli seç" />
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
        <Button type="submit" disabled={pending}>{pending ? "Kaydediliyor…" : "Reklamı ekle"}</Button>
      </div>
    </form>
  );
}
