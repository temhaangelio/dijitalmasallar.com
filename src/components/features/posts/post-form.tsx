"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Check, Clock3, Save } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createPostAction, updatePostAction } from "@/app/(dashboard)/yazilar/actions";
import { FormField } from "@/components/forms/form-field";
import { FileUpload } from "@/components/forms/file-upload";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      tr: { body: posts?.tr?.body ?? "" },
      en: { body: posts?.en?.body ?? "" },
      sourceUrl: sharedPost?.source_url ?? "",
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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="admin-post-form grid gap-5 pb-24 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:pb-0" noValidate>
      <div className="card min-w-0 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">İçerik</h2>
          </div>
          <div role="group" aria-label="İçerik dili" className="grid grid-cols-2 gap-1.5 rounded-field bg-surface-3 p-1.5 sm:w-64">
              {(["tr", "en"] as const).map((language) => (
                <button key={language} type="button" aria-pressed={activeLanguage === language} onClick={() => setActiveLanguage(language)} className={`min-h-11 rounded-xl text-sm font-semibold transition ${activeLanguage === language ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"}`}>
                  {language === "tr" ? "Türkçe" : "English"}
                </button>
              ))}
          </div>
        </div>
        <FormField
          label={activeLanguage === "tr" ? "Türkçe içerik" : "İngilizce içerik"}
          htmlFor={`${activeLanguage}-body`}
          error={errors[activeLanguage]?.body?.message}
        >
          <Controller
            name={`${activeLanguage}.body`}
            control={control}
            render={({ field }) => <RichTextEditor key={activeLanguage} id={`${activeLanguage}-body`} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} showToolbar onPasteText={importBilingualPaste} />}
          />
        </FormField>
        <div className="border-t border-line pt-5">
          <FormField label="Kaynak bağlantısı" htmlFor="sourceUrl" error={errors.sourceUrl?.message}>
            <Input id="sourceUrl" type="url" placeholder="https://..." {...register("sourceUrl")} />
          </FormField>
        </div>
      </div>

      <div className="space-y-5">
        <div className="admin-save-bar">
          <Link href="/yazilar" className={buttonVariants({ variant: "secondary" })}>Vazgeç</Link>
          <Button disabled={pending} className="min-w-40">
            <Save className="size-4" aria-hidden="true" />
            {pending ? (editing ? "Güncelleniyor…" : "Kaydediliyor…") : (editing ? "Değişiklikleri kaydet" : status === "scheduled" ? "Yazıyı planla" : "Yazıyı yayınla")}
          </Button>
        </div>

        <div className="card space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Kapak görseli <span className="font-normal text-muted">(isteğe bağlı)</span></h3>
            <FileUpload
              onChange={(file) => { setCoverImage(file); if (file) setRemoveCover(false); }}
              preview={sharedPost?.cover_path && !removeCover ? (isOptimizableImage(sharedPost.cover_path)
                ? <Image src={sharedPost.cover_path} alt="Mevcut kapak görseli" fill sizes="360px" className="object-cover" />
                // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
                : <img src={sharedPost.cover_path} alt="Mevcut kapak görseli" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />) : undefined}
            />
            {sharedPost?.cover_path && !removeCover && !coverImage ? <button type="button" onClick={() => setRemoveCover(true)} className="mt-2 min-h-11 text-sm font-semibold text-danger hover:underline">Mevcut görseli kaldır</button> : null}
            {removeCover && !coverImage ? <button type="button" onClick={() => setRemoveCover(false)} className="mt-2 text-xs font-semibold text-muted hover:text-ink">Mevcut görseli geri getir</button> : null}
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">Yayın zamanı</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 flex cursor-pointer items-center gap-2 rounded-field border px-3 py-3 text-sm font-semibold transition ${status === "published" ? "border-ink bg-ink text-white" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink"}`}>
                <input type="radio" value="published" className="sr-only" {...register("status")} />
                <Check className="size-4" aria-hidden="true" /> Şimdi
              </label>
              <label className={`has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 flex cursor-pointer items-center gap-2 rounded-field border px-3 py-3 text-sm font-semibold transition ${status === "scheduled" ? "border-ink bg-ink text-white" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink"}`}>
                <input type="radio" value="scheduled" className="sr-only" {...register("status")} />
                <Clock3 className="size-4" aria-hidden="true" /> Planla
              </label>
            </div>
            {errors.status?.message ? <p className="mt-2 text-xs text-danger">{errors.status.message}</p> : null}
          </fieldset>
          {editing && status === "published" && <FormField label="Yayın tarihi" htmlFor="publishedAt" error={errors.publishedAt?.message} hint="Akış sıralaması bu tarih ve saate göre güncellenir."><Input id="publishedAt" type="datetime-local" {...register("publishedAt")} /></FormField>}
          {status === "scheduled" && <FormField label="Yayın tarihi" htmlFor="scheduledAt" error={errors.scheduledAt?.message}><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} /></FormField>}
        </div>

      </div>
    </form>
  );
}
