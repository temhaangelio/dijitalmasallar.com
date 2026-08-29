"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createPostAction, updatePostAction } from "@/app/(dashboard)/yazilar/actions";
import { FormField } from "@/components/forms/form-field";
import { FileUpload } from "@/components/forms/file-upload";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/toast";
import { postSchema, type PostFormValues } from "@/lib/validations/post";
import { isOptimizableImage } from "@/lib/images";
import { parseBilingualPostPaste } from "@/lib/post-content";
import type { Post } from "@/types/database";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

type PostTranslations = Partial<Record<"tr" | "en", Post>>;

export function PostForm({ posts, combinedEntry = false }: { posts?: PostTranslations; combinedEntry?: boolean }) {
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
      tr: { body: posts?.tr?.body ?? "" },
      en: { body: posts?.en?.body ?? "" },
      sourceUrl: sharedPost?.source_url ?? "",
      featured: sharedPost?.featured ?? false,
      status: sharedPost?.status === "scheduled" ? "scheduled" : "published",
      scheduledAt: localDateTime(sharedPost?.scheduled_at ?? null),
      publishedAt: sharedPost?.status === "published" ? localDateTime(sharedPost.created_at) : "",
    },
  });
  const status = useWatch({ control, name: "status" });

  function importBilingualPaste(value: string) {
    const parsed = parseBilingualPostPaste(value);
    if (!parsed) return false;
    setValue("tr.body", parsed.tr, { shouldDirty: true, shouldValidate: true });
    setValue("en.body", parsed.en, { shouldDirty: true, shouldValidate: true });
    if (parsed.sourceUrl) setValue("sourceUrl", parsed.sourceUrl, { shouldDirty: true, shouldValidate: true });
    setActiveLanguage("tr");
    showToast(parsed.sourceUrl ? "Türkçe, İngilizce ve kaynak bağlantısı yerleştirildi." : "Türkçe ve İngilizce içerikler yerleştirildi.", "success");
    return parsed.tr;
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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start" noValidate>
      <div className="card space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="section-title">İçerik</h2>
          <div role="tablist" aria-label="İçerik dili" className="grid grid-cols-2 gap-1.5 rounded-field bg-surface-3 p-1.5 sm:w-64">
              {(["tr", "en"] as const).map((language) => (
                <button key={language} type="button" role="tab" aria-selected={activeLanguage === language} onClick={() => setActiveLanguage(language)} className={`h-10 rounded-xl text-sm font-semibold transition ${activeLanguage === language ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"}`}>
                  {language === "tr" ? "Türkçe" : "English"}
                </button>
              ))}
          </div>
        </div>
        <FormField
          label={activeLanguage === "tr" ? "Türkçe yazı" : "English content"}
          htmlFor={`${activeLanguage}-body`}
          error={errors[activeLanguage]?.body?.message}
          hint={combinedEntry ? "TR: ile başlayan Türkçe metni, ardından EN: ile başlayan İngilizce metni ve kaynak bağlantısını birlikte yapıştırın." : undefined}
        >
          <Controller
            name={`${activeLanguage}.body`}
            control={control}
            render={({ field }) => <RichTextEditor key={activeLanguage} id={`${activeLanguage}-body`} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} showToolbar={editing} onPasteText={importBilingualPaste} />}
          />
        </FormField>
      </div>

      <div className="space-y-5">
        <div className="card space-y-5">
          <FormField label="Kaynak bağlantısı" htmlFor="sourceUrl" error={errors.sourceUrl?.message} hint="İçeriğin özgün kaynağına ait bağlantıyı ekleyin."><Input id="sourceUrl" type="url" placeholder="https://..." {...register("sourceUrl")} /></FormField>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Kapak görseli <span className="font-normal text-muted">(isteğe bağlı)</span></h3>
            {sharedPost?.cover_path && !removeCover && !coverImage ? <div className="mb-3 overflow-hidden rounded-field bg-surface-3"><div className="relative aspect-[4/3]">{isOptimizableImage(sharedPost.cover_path)
              ? <Image src={sharedPost.cover_path} alt="Mevcut kapak görseli" fill sizes="360px" className="object-cover" />
              // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
              : <img src={sharedPost.cover_path} alt="Mevcut kapak görseli" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}</div><button type="button" onClick={() => setRemoveCover(true)} className="w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-danger-surface">Mevcut görseli kaldır</button></div> : null}
            <FileUpload onChange={(file) => { setCoverImage(file); if (file) setRemoveCover(false); }} label={sharedPost?.cover_path && !removeCover ? "Kapak görselini değiştir" : "Kapak görseli seç"} />
            {removeCover && !coverImage ? <button type="button" onClick={() => setRemoveCover(false)} className="mt-2 text-xs font-semibold text-muted hover:text-ink">Mevcut görseli geri getir</button> : null}
            <p className="mt-2 text-xs leading-5 text-muted">JPG, PNG veya WebP · en fazla 5 MB · 800 × 600 ve yaklaşık 350 KB’a küçültülür</p>
          </div>
          <FormField label="Durum" htmlFor="status" error={errors.status?.message}>
            <Select id="status" {...register("status")}><option value="published">Şimdi yayınla</option><option value="scheduled">Planlı</option></Select>
          </FormField>
          <div className="flex items-center justify-between gap-4 rounded-field border border-line bg-surface-2 px-4 py-3.5">
            <div className="min-w-0">
              <strong className="block text-sm text-ink">Öne çıkan yazı</strong>
              <p className="mt-1 text-xs leading-5 text-muted">Bu yazıyı öne çıkan içerik olarak işaretle.</p>
            </div>
            <Controller name="featured" control={control} render={({ field }) => <Switch label="Öne çıkan yazı" checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
          {editing && status === "published" && <FormField label="Yayın tarihi" htmlFor="publishedAt" error={errors.publishedAt?.message} hint="Akış sıralaması bu tarih ve saate göre güncellenir."><Input id="publishedAt" type="datetime-local" {...register("publishedAt")} /></FormField>}
          {status === "scheduled" && <FormField label="Yayın tarihi" htmlFor="scheduledAt" error={errors.scheduledAt?.message}><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} /></FormField>}
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/yazilar" className={buttonVariants({ variant: "secondary" })}>Vazgeç</Link>
          <Button disabled={pending}>{pending ? (editing ? "Güncelleniyor…" : "Kaydediliyor…") : (editing ? "Değişiklikleri kaydet" : "Yazıyı kaydet")}</Button>
        </div>
      </div>
    </form>
  );
}
