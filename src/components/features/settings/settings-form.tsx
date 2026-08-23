"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { saveSettingsAction } from "@/app/(dashboard)/ayarlar/actions";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import { settingsSchema, type SettingsFormValues } from "@/lib/validations/settings";
import type { SiteSettings } from "@/services/settings";

type SettingsSection = "general" | "newsletter" | "visibility" | "modules";

export function SettingsForm({ initialValues, section }: { initialValues: SiteSettings; section: SettingsSection }) {
  const [pending, startTransition] = useTransition();
  const values: SettingsFormValues = { ...initialValues };
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema), defaultValues: values });
  const newsletterEnabled = useWatch({ control, name: "newsletterEnabled" });
  const showSubscriberCount = useWatch({ control, name: "showSubscriberCount" });
  const maintenanceMode = useWatch({ control, name: "maintenanceMode" });
  const modulePosts = useWatch({ control, name: "modulePosts" });
  const moduleNewsletter = useWatch({ control, name: "moduleNewsletter" });
  const moduleAds = useWatch({ control, name: "moduleAds" });
  const moduleAnalytics = useWatch({ control, name: "moduleAnalytics" });

  const save = (formValues: SettingsFormValues) => startTransition(async () => {
    try {
      const result = await saveSettingsAction(formValues);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) reset(formValues);
    } catch {
      showToast("Ayarlar şu anda kaydedilemedi.", "error");
    }
  });

  return (
    <form onSubmit={handleSubmit(save)} className="w-full space-y-5">
      {section === "general" ? <div className="card space-y-5">
        <h2 className="section-title">Ziyaretçi sayfası</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Site adı" htmlFor="siteName" error={errors.siteName?.message}><Input id="siteName" {...register("siteName")} /></FormField>
          <FormField label="Alan adı" htmlFor="domain" error={errors.domain?.message}><Input id="domain" {...register("domain")} /></FormField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Türkçe açıklama" htmlFor="description" error={errors.description?.message} hint="Ana sayfa başlığı ve arama sonuçlarındaki özet. Tek cümlede tutun."><Textarea id="description" {...register("description")} /></FormField>
          <FormField label="İngilizce açıklama" htmlFor="descriptionEn" error={errors.descriptionEn?.message} hint="Aynı metnin İngilizcesi."><Textarea id="descriptionEn" {...register("descriptionEn")} /></FormField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Türkçe hakkında metni" htmlFor="aboutText" error={errors.aboutText?.message} hint="Yalnızca /hakkinda sayfasında görünür. 2–3 cümle uygundur."><Textarea id="aboutText" className="min-h-36" {...register("aboutText")} /></FormField>
          <FormField label="İngilizce hakkında metni" htmlFor="aboutTextEn" error={errors.aboutTextEn?.message} hint="Aynı metnin İngilizcesi."><Textarea id="aboutTextEn" className="min-h-36" {...register("aboutTextEn")} /></FormField>
        </div>
        <FormField label="Gösterilecek yazı" htmlFor="postsPerPage" error={errors.postsPerPage?.message}><Input id="postsPerPage" type="number" min={3} max={20} {...register("postsPerPage", { valueAsNumber: true })} /></FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Dil" htmlFor="language"><Select id="language" {...register("language")}><option value="tr">Türkçe</option><option value="en">English</option></Select></FormField>
          <FormField label="Yazı akışı biçimi" htmlFor="feedLayout"><Select id="feedLayout" {...register("feedLayout")}><option value="short">Kısa akış</option><option value="card">Kart</option><option value="classic">Klasik liste</option></Select></FormField>
        </div>
        <FormField label="İletişim e-postası" htmlFor="contactEmail" error={errors.contactEmail?.message}><Input id="contactEmail" type="email" {...register("contactEmail")} /></FormField>
      </div> : null}

      {section === "newsletter" ? <div className="card">
          <h2 className="section-title">E-bülten alanı</h2>
          <div className="mt-5 flex items-center justify-between gap-4 border-b border-line pb-5">
            <div><strong className="text-[15px]">Bülteni göster</strong><p className="mt-1 text-[13px] text-muted">Ziyaretçi akışında abonelik formunu gösterir.</p></div>
            <Switch label="Bülteni göster" checked={newsletterEnabled} onCheckedChange={(value) => setValue("newsletterEnabled", value, { shouldDirty: true })} />
          </div>
          <div className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Türkçe bülten başlığı" htmlFor="newsletterTitle" error={errors.newsletterTitle?.message}><Input id="newsletterTitle" disabled={!newsletterEnabled} {...register("newsletterTitle")} /></FormField>
              <FormField label="İngilizce bülten başlığı" htmlFor="newsletterTitleEn" error={errors.newsletterTitleEn?.message}><Input id="newsletterTitleEn" disabled={!newsletterEnabled} {...register("newsletterTitleEn")} /></FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Türkçe bülten açıklaması" htmlFor="newsletterDescription" error={errors.newsletterDescription?.message}><Textarea id="newsletterDescription" disabled={!newsletterEnabled} {...register("newsletterDescription")} /></FormField>
              <FormField label="İngilizce bülten açıklaması" htmlFor="newsletterDescriptionEn" error={errors.newsletterDescriptionEn?.message}><Textarea id="newsletterDescriptionEn" disabled={!newsletterEnabled} {...register("newsletterDescriptionEn")} /></FormField>
            </div>
          </div>
      </div> : null}

      {section === "visibility" ? <div className="card">
          <h2 className="section-title">Görünürlük</h2>
          <div className="mt-5 divide-y divide-line">
            <div className="flex items-center justify-between gap-4 pb-4"><div><strong className="text-[15px]">Abone sayısını göster</strong><p className="mt-1 text-[13px] text-muted">Ana başlığın altında gerçek aktif abone sayısı görünür.</p></div><Switch label="Abone sayısını göster" checked={showSubscriberCount} onCheckedChange={(value) => setValue("showSubscriberCount", value, { shouldDirty: true })} /></div>
            <div className="flex items-center justify-between gap-4 pt-4"><div><strong className="text-[15px]">Bakım modu</strong><p className="mt-1 text-[13px] text-muted">Ziyaretçilere geçici bakım ekranı gösterir.</p></div><Switch label="Bakım modu" checked={maintenanceMode} onCheckedChange={(value) => setValue("maintenanceMode", value, { shouldDirty: true })} /></div>
          </div>
      </div> : null}

      {section === "modules" ? <div className="card">
          <h2 className="section-title">Panel modülleri</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Kapalı modüller menüden kaldırılır ve doğrudan erişime kapanır.</p>
          <div className="mt-5 divide-y divide-line">
            {[
              ["Yazılar", "İçerik ekleme ve yönetme ekranları", "modulePosts", modulePosts],
              ["E-bülten", "Bülten ve abone yönetimi", "moduleNewsletter", moduleNewsletter],
              ["Reklamlar", "Reklam ekleme ve yayınlama", "moduleAds", moduleAds],
              ["İstatistik", "Vercel Analytics raporları", "moduleAnalytics", moduleAnalytics],
            ].map(([title, description, name, checked]) => <div key={String(name)} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><strong className="text-[15px]">{title}</strong><p className="mt-1 text-[13px] text-muted">{description}</p></div><Switch label={`${title} modülünü etkinleştir`} checked={Boolean(checked)} onCheckedChange={(value) => setValue(name as "modulePosts" | "moduleNewsletter" | "moduleAds" | "moduleAnalytics", value, { shouldDirty: true })} /></div>)}
          </div>
      </div> : null}

      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={!isDirty || pending} onClick={() => reset(values)}>Vazgeç</Button><Button disabled={!isDirty || pending}>{pending ? "Kaydediliyor…" : "Kaydet"}</Button></div>
    </form>
  );
}
