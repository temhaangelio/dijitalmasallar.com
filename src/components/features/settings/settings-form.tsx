"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { saveSettingsAction } from "@/app/(dashboard)/ayarlar/actions";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { settingsSchema, type SettingsFormValues } from "@/lib/validations/settings";
import type { SiteSettings } from "@/services/settings";

export function SettingsForm({ initialValues }: { initialValues: SiteSettings }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const values: SettingsFormValues = { ...initialValues };
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema), defaultValues: values });
  const newsletterEnabled = useWatch({ control, name: "newsletterEnabled" });
  const showSubscriberCount = useWatch({ control, name: "showSubscriberCount" });
  const maintenanceMode = useWatch({ control, name: "maintenanceMode" });

  const save = (formValues: SettingsFormValues) => startTransition(async () => {
    try {
      const result = await saveSettingsAction(formValues);
      setMessage({ ok: result.success, text: result.message });
      if (result.success) reset(formValues);
    } catch {
      setMessage({ ok: false, text: "Ayarlar şu anda kaydedilemedi." });
    }
  });

  return (
    <form onSubmit={handleSubmit(save)} className="grid gap-5 xl:grid-cols-12">
      <div className="card space-y-5 xl:col-span-7">
        <h2 className="section-title">Ziyaretçi sayfası</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Site adı" htmlFor="siteName" error={errors.siteName?.message}><Input id="siteName" {...register("siteName")} /></FormField>
          <FormField label="Alan adı" htmlFor="domain" error={errors.domain?.message}><Input id="domain" {...register("domain")} /></FormField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Türkçe açıklama" htmlFor="description" error={errors.description?.message}><Textarea id="description" {...register("description")} /></FormField>
          <FormField label="İngilizce açıklama" htmlFor="descriptionEn" error={errors.descriptionEn?.message}><Textarea id="descriptionEn" {...register("descriptionEn")} /></FormField>
        </div>
        <FormField label="Gösterilecek yazı" htmlFor="postsPerPage" error={errors.postsPerPage?.message}><Input id="postsPerPage" type="number" min={3} max={20} {...register("postsPerPage", { valueAsNumber: true })} /></FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Dil" htmlFor="language"><Select id="language" {...register("language")}><option value="tr">Türkçe</option><option value="en">English</option></Select></FormField>
          <FormField label="Yazı akışı biçimi" htmlFor="feedLayout"><Select id="feedLayout" {...register("feedLayout")}><option value="short">Kısa akış</option><option value="card">Kart</option><option value="classic">Klasik liste</option></Select></FormField>
        </div>
        <FormField label="İletişim e-postası" htmlFor="contactEmail" error={errors.contactEmail?.message}><Input id="contactEmail" type="email" {...register("contactEmail")} /></FormField>
      </div>

      <div className="space-y-5 xl:col-span-5">
        <div className="card">
          <h2 className="section-title">E-bülten alanı</h2>
          <div className="mt-5 flex items-center justify-between gap-4 border-b border-[#f1f1f1] pb-5">
            <div><strong className="text-[15px]">Bülteni göster</strong><p className="mt-1 text-[13px] text-[#a1a1a1]">Ziyaretçi akışında abonelik formunu gösterir.</p></div>
            <Switch label="Bülteni göster" checked={newsletterEnabled} onCheckedChange={(value) => setValue("newsletterEnabled", value, { shouldDirty: true })} />
          </div>
          <div className="mt-5 space-y-5">
            <FormField label="Bülten başlığı" htmlFor="newsletterTitle" error={errors.newsletterTitle?.message}><Input id="newsletterTitle" disabled={!newsletterEnabled} {...register("newsletterTitle")} /></FormField>
            <FormField label="Bülten açıklaması" htmlFor="newsletterDescription" error={errors.newsletterDescription?.message}><Textarea id="newsletterDescription" disabled={!newsletterEnabled} {...register("newsletterDescription")} /></FormField>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Görünürlük</h2>
          <div className="mt-5 divide-y divide-[#f1f1f1]">
            <div className="flex items-center justify-between gap-4 pb-4"><div><strong className="text-[15px]">Abone sayısını göster</strong><p className="mt-1 text-[13px] text-[#a1a1a1]">Ana başlığın altında gerçek aktif abone sayısı görünür.</p></div><Switch label="Abone sayısını göster" checked={showSubscriberCount} onCheckedChange={(value) => setValue("showSubscriberCount", value, { shouldDirty: true })} /></div>
            <div className="flex items-center justify-between gap-4 pt-4"><div><strong className="text-[15px]">Bakım modu</strong><p className="mt-1 text-[13px] text-[#a1a1a1]">Ziyaretçilere geçici bakım ekranı gösterir.</p></div><Switch label="Bakım modu" checked={maintenanceMode} onCheckedChange={(value) => setValue("maintenanceMode", value, { shouldDirty: true })} /></div>
          </div>
        </div>

        {message && <p aria-live="polite" className={`rounded-2xl p-4 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-[#fff1f0] text-[#b42318]"}`}>{message.text}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={!isDirty || pending} onClick={() => { reset(values); setMessage(null); }}>Vazgeç</Button><Button disabled={!isDirty || pending}>{pending ? "Kaydediliyor…" : "Kaydet"}</Button></div>
      </div>
    </form>
  );
}
