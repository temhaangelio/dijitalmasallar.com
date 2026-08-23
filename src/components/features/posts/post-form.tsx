"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createPostAction, updatePostAction } from "@/app/(dashboard)/yazilar/actions";
import { FormField } from "@/components/forms/form-field";
import { FileUpload } from "@/components/forms/file-upload";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import { postSchema, type PostFormValues } from "@/lib/validations/post";
import { isOptimizableImage } from "@/lib/images";
import type { Post } from "@/types/database";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

type PostTranslations = Partial<Record<"tr" | "en", Post>>;
const visibilityPreferenceKey = "diji-news-new-post-visibility";

export function PostForm({ posts }: { posts?: PostTranslations }) {
  const router = useRouter();
  const [activeLanguage, setActiveLanguage] = useState<"tr" | "en">("tr");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(posts);
  const sharedPost = posts?.tr ?? posts?.en;
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      tr: { title: posts?.tr?.title ?? "", excerpt: posts?.tr?.excerpt ?? "", body: posts?.tr?.body ?? "" },
      en: { title: posts?.en?.title ?? "", excerpt: posts?.en?.excerpt ?? "", body: posts?.en?.body ?? "" },
      category: sharedPost?.category ?? "",
      sourceName: sharedPost?.source_name ?? "",
      sourceUrl: sharedPost?.source_url ?? "",
      showTitle: sharedPost ? sharedPost.show_title !== false : false,
      showExcerpt: sharedPost ? sharedPost.show_excerpt !== false : false,
      status: sharedPost?.status === "scheduled" ? "scheduled" : "published",
      scheduledAt: localDateTime(sharedPost?.scheduled_at ?? null),
      publishedAt: sharedPost?.status === "published" ? localDateTime(sharedPost.created_at) : "",
    },
  });
  const status = useWatch({ control, name: "status" });
  const showTitle = useWatch({ control, name: "showTitle" });
  const showExcerpt = useWatch({ control, name: "showExcerpt" });

  useEffect(() => {
    if (editing) return;
    try {
      const saved = JSON.parse(localStorage.getItem(visibilityPreferenceKey) ?? "null") as { showTitle?: unknown; showExcerpt?: unknown } | null;
      if (typeof saved?.showTitle === "boolean") setValue("showTitle", saved.showTitle);
      if (typeof saved?.showExcerpt === "boolean") setValue("showExcerpt", saved.showExcerpt);
    } catch { /* Invalid preferences keep the form defaults. */ }
  }, [editing, setValue]);

  function rememberVisibility(next: Partial<Pick<PostFormValues, "showTitle" | "showExcerpt">>) {
    try {
      const current = JSON.parse(localStorage.getItem(visibilityPreferenceKey) ?? "{}") as Partial<Pick<PostFormValues, "showTitle" | "showExcerpt">>;
      localStorage.setItem(visibilityPreferenceKey, JSON.stringify({ ...current, ...next }));
    } catch { /* Storage may be unavailable in private browsing modes. */ }
  }

  const onSubmit = (values: PostFormValues) => startTransition(async () => {
    try {
      const result = sharedPost ? await updatePostAction(sharedPost.id, values, coverImage, removeCover) : await createPostAction(values, coverImage);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) {
        router.push("/yazilar");
        router.refresh();
      }
    } catch (error) {
      console.error("Post action failed before reaching Supabase", error);
      showToast("Form bağlantısı güncellendi. Sayfayı yenileyip tekrar deneyin.", "error");
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
          </div>
          <div role="tablist" aria-label="İçerik dili" className="grid grid-cols-2 gap-1.5 rounded-field bg-surface-3 p-1.5 sm:w-64">
            {(["tr", "en"] as const).map((language) => (
              <button key={language} type="button" role="tab" aria-selected={activeLanguage === language} onClick={() => setActiveLanguage(language)} className={`h-10 rounded-xl text-sm font-semibold transition ${activeLanguage === language ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"}`}>
                {language === "tr" ? "Türkçe" : "English"}
              </button>
            ))}
          </div>
        </div>
        {showTitle ? <FormField label={activeLanguage === "tr" ? "Türkçe başlık (isteğe bağlı)" : "English title"} htmlFor={`${activeLanguage}-title`} error={errors[activeLanguage]?.title?.message}><Input id={`${activeLanguage}-title`} {...register(`${activeLanguage}.title`)} /></FormField> : null}
        {showExcerpt ? <FormField label={activeLanguage === "tr" ? "Türkçe kısa özet (isteğe bağlı)" : "English summary"} htmlFor={`${activeLanguage}-excerpt`} error={errors[activeLanguage]?.excerpt?.message} hint={activeLanguage === "tr" ? undefined : "Akışta 250–400 karakter aralığı önerilir."}><Textarea id={`${activeLanguage}-excerpt`} {...register(`${activeLanguage}.excerpt`)} /></FormField> : null}
        <FormField label={activeLanguage === "tr" ? "Türkçe yazı" : "English content"} htmlFor={`${activeLanguage}-body`} error={errors[activeLanguage]?.body?.message}>
          <Controller
            name={`${activeLanguage}.body`}
            control={control}
            render={({ field }) => <RichTextEditor key={activeLanguage} id={`${activeLanguage}-body`} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
          />
        </FormField>
        <FormField label="Kaynak bağlantısı" htmlFor="sourceUrl" error={errors.sourceUrl?.message} hint="İçeriğin özgün kaynağına ait bağlantıyı ekleyin."><Input id="sourceUrl" type="url" placeholder="https://..." {...register("sourceUrl")} /></FormField>
      </div>
      <aside className="space-y-5">
        <div className="card space-y-5">
          <h2 className="section-title">Yayın</h2>
          <FormField label="Kategori (isteğe bağlı)" htmlFor="category" error={errors.category?.message}><Input id="category" {...register("category")} /></FormField>
          <FormField label="Kaynak adı (isteğe bağlı)" htmlFor="sourceName" error={errors.sourceName?.message}><Input id="sourceName" placeholder="Örn. OpenAI" {...register("sourceName")} /></FormField>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Kapak görseli <span className="font-normal text-muted">(isteğe bağlı)</span></h3>
            {sharedPost?.cover_path && !removeCover && !coverImage ? <div className="mb-3 overflow-hidden rounded-field bg-surface-3"><div className="relative aspect-[4/3]">{isOptimizableImage(sharedPost.cover_path)
              ? <Image src={sharedPost.cover_path} alt="Mevcut kapak görseli" fill sizes="360px" className="object-cover" />
              // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
              : <img src={sharedPost.cover_path} alt="Mevcut kapak görseli" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}</div><button type="button" onClick={() => setRemoveCover(true)} className="w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-danger-surface">Mevcut görseli kaldır</button></div> : null}
            <FileUpload onChange={(file) => { setCoverImage(file); if (file) setRemoveCover(false); }} label={sharedPost?.cover_path && !removeCover ? "Kapak görselini değiştir" : "Kapak görseli seç"} />
            {removeCover && !coverImage ? <button type="button" onClick={() => setRemoveCover(false)} className="mt-2 text-xs font-semibold text-muted hover:text-ink">Mevcut görseli geri getir</button> : null}
            <p className="mt-2 text-xs leading-5 text-muted">JPG, PNG veya WebP · en fazla 5 MB</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Ziyaretçi görünümü</h3>
            <div className="divide-y divide-line rounded-field bg-surface-2 px-4">
              <div className="flex items-center justify-between gap-4 py-4"><div><strong className="block text-sm">Başlığı göster</strong><small className="mt-1 block text-muted">Yazı başlığı ziyaretçi kartında görünür.</small></div><Controller name="showTitle" control={control} render={({ field }) => <Switch label="Başlığı ziyaretçiye göster" checked={field.value} onCheckedChange={(checked) => { if (!checked) { setValue("tr.title", "", { shouldDirty: true }); setValue("en.title", "", { shouldDirty: true }); } field.onChange(checked); rememberVisibility({ showTitle: checked }); }} />} /></div>
              <div className="flex items-center justify-between gap-4 py-4"><div><strong className="block text-sm">Özeti göster</strong><small className="mt-1 block text-muted">Kısa özet ziyaretçi kartında görünür.</small></div><Controller name="showExcerpt" control={control} render={({ field }) => <Switch label="Özeti ziyaretçiye göster" checked={field.value} onCheckedChange={(checked) => { if (!checked) { setValue("tr.excerpt", "", { shouldDirty: true }); setValue("en.excerpt", "", { shouldDirty: true }); } field.onChange(checked); rememberVisibility({ showExcerpt: checked }); }} />} /></div>
            </div>
          </div>
          <FormField label="Durum" htmlFor="status" error={errors.status?.message}>
            <Select id="status" {...register("status")}><option value="published">Şimdi yayınla</option><option value="scheduled">Planlı</option></Select>
          </FormField>
          {editing && status === "published" && <FormField label="Yayın tarihi" htmlFor="publishedAt" error={errors.publishedAt?.message} hint="Akış sıralaması bu tarih ve saate göre güncellenir."><Input id="publishedAt" type="datetime-local" {...register("publishedAt")} /></FormField>}
          {status === "scheduled" && <FormField label="Yayın tarihi" htmlFor="scheduledAt" error={errors.scheduledAt?.message}><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} /></FormField>}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/yazilar" className={buttonVariants({ variant: "secondary" })}>Vazgeç</Link>
            <Button disabled={pending}>{pending ? (editing ? "Güncelleniyor…" : "Kaydediliyor…") : (editing ? "Değişiklikleri kaydet" : "Yazıyı kaydet")}</Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
