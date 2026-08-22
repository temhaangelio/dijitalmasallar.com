"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createPostAction, updatePostAction } from "@/app/(dashboard)/yazilar/actions";
import { FormField } from "@/components/forms/form-field";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { postSchema, type PostFormValues } from "@/lib/validations/post";
import type { Post } from "@/types/database";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

type PostTranslations = Partial<Record<"tr" | "en", Post>>;

export function PostForm({ posts }: { posts?: PostTranslations }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<"tr" | "en">("tr");
  const [pending, startTransition] = useTransition();
  const editing = Boolean(posts);
  const sharedPost = posts?.tr ?? posts?.en;
  const { register, control, handleSubmit, formState: { errors } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      tr: { title: posts?.tr?.title ?? "", excerpt: posts?.tr?.excerpt ?? "", body: posts?.tr?.body ?? "" },
      en: { title: posts?.en?.title ?? "", excerpt: posts?.en?.excerpt ?? "", body: posts?.en?.body ?? "" },
      category: sharedPost?.category ?? "",
      sourceName: sharedPost?.source_name ?? "",
      sourceUrl: sharedPost?.source_url ?? "",
      showTitle: sharedPost?.show_title !== false,
      showExcerpt: sharedPost?.show_excerpt !== false,
      status: sharedPost?.status === "scheduled" ? "scheduled" : "published",
      scheduledAt: localDateTime(sharedPost?.scheduled_at ?? null),
    },
  });
  const status = useWatch({ control, name: "status" });

  const onSubmit = (values: PostFormValues) => startTransition(async () => {
    try {
      const result = sharedPost ? await updatePostAction(sharedPost.id, values) : await createPostAction(values);
      setMessage(result.message);
      if (result.success) {
        router.push("/yazilar");
        router.refresh();
      }
    } catch {
      setMessage(editing ? "Yazı güncellenemedi. Lütfen tekrar deneyin." : "Yazı kaydedilemedi. Supabase ayarlarını kontrol edin.");
    }
  });

  const onInvalid = (formErrors: typeof errors) => {
    if (formErrors.tr) setActiveLanguage("tr");
    else if (formErrors.en) setActiveLanguage("en");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" noValidate>
      <div className="card space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">İçerik</h2>
            <p className="mt-1 text-sm text-[#8b8b8b]">İki dil de aynı kayıt işleminde kaydedilir.</p>
          </div>
          <div role="tablist" aria-label="İçerik dili" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#f1f1f1] p-1.5 sm:w-64">
            {(["tr", "en"] as const).map((language) => (
              <button key={language} type="button" role="tab" aria-selected={activeLanguage === language} onClick={() => setActiveLanguage(language)} className={`h-10 rounded-xl text-sm font-semibold transition ${activeLanguage === language ? "bg-black text-white shadow-sm" : "text-[#666] hover:bg-white hover:text-black"}`}>
                {language === "tr" ? "Türkçe" : "English"}
              </button>
            ))}
          </div>
        </div>
        <FormField label={activeLanguage === "tr" ? "Türkçe başlık" : "English title"} htmlFor={`${activeLanguage}-title`} error={errors[activeLanguage]?.title?.message}><Input id={`${activeLanguage}-title`} {...register(`${activeLanguage}.title`)} /></FormField>
        <FormField label={activeLanguage === "tr" ? "Türkçe kısa özet" : "English summary"} htmlFor={`${activeLanguage}-excerpt`} error={errors[activeLanguage]?.excerpt?.message} hint="Akışta 250–400 karakter aralığı önerilir."><Textarea id={`${activeLanguage}-excerpt`} {...register(`${activeLanguage}.excerpt`)} /></FormField>
        <FormField label={activeLanguage === "tr" ? "Türkçe yazı" : "English content"} htmlFor={`${activeLanguage}-body`} error={errors[activeLanguage]?.body?.message} hint="Metni seçip araç çubuğundan biçim uygulayabilirsiniz.">
          <Controller
            name={`${activeLanguage}.body`}
            control={control}
            render={({ field }) => <RichTextEditor key={activeLanguage} id={`${activeLanguage}-body`} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
          />
        </FormField>
      </div>
      <aside className="space-y-5">
        <div className="card space-y-5">
          <h2 className="section-title">Yayın</h2>
          <FormField label="Kategori" htmlFor="category" error={errors.category?.message}><Input id="category" {...register("category")} /></FormField>
          <FormField label="Kaynak adı" htmlFor="sourceName" error={errors.sourceName?.message}><Input id="sourceName" placeholder="Örn. OpenAI" {...register("sourceName")} /></FormField>
          <FormField label="Kaynak bağlantısı" htmlFor="sourceUrl" error={errors.sourceUrl?.message}><Input id="sourceUrl" type="url" placeholder="https://..." {...register("sourceUrl")} /></FormField>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Ziyaretçi görünümü</h3>
            <div className="divide-y divide-[#e8e8e8] rounded-2xl bg-[#f5f5f5] px-4">
              <div className="flex items-center justify-between gap-4 py-4"><div><strong className="block text-sm">Başlığı göster</strong><small className="mt-1 block text-[#a1a1a1]">Yazı başlığı ziyaretçi kartında görünür.</small></div><Controller name="showTitle" control={control} render={({ field }) => <Switch label="Başlığı ziyaretçiye göster" checked={field.value} onCheckedChange={field.onChange} />} /></div>
              <div className="flex items-center justify-between gap-4 py-4"><div><strong className="block text-sm">Özeti göster</strong><small className="mt-1 block text-[#a1a1a1]">Kısa özet ziyaretçi kartında görünür.</small></div><Controller name="showExcerpt" control={control} render={({ field }) => <Switch label="Özeti ziyaretçiye göster" checked={field.value} onCheckedChange={field.onChange} />} /></div>
            </div>
          </div>
          <FormField label="Durum" htmlFor="status" error={errors.status?.message}>
            <Select id="status" {...register("status")}><option value="published">Şimdi yayınla</option><option value="scheduled">Planlı</option></Select>
          </FormField>
          {status === "scheduled" && <FormField label="Yayın tarihi" htmlFor="scheduledAt" error={errors.scheduledAt?.message}><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} /></FormField>}
          <p className="text-[13px] leading-relaxed text-[#a1a1a1]">Mevcut Dijital Masallar veri modeli görselsiz kısa notlar ve ileri tarihli yayınları destekler.</p>
          {message && <p aria-live="polite" className="rounded-2xl bg-[#f5f5f5] p-3 text-sm">{message}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/yazilar" className={buttonVariants({ variant: "secondary" })}>Vazgeç</Link>
            <Button disabled={pending}>{pending ? (editing ? "Güncelleniyor…" : "Kaydediliyor…") : (editing ? "Değişiklikleri kaydet" : "Yazıyı kaydet")}</Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
