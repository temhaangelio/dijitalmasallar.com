"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Check, Clock3, Save, Images, ChevronLeft, ChevronRight } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createPostAction, updatePostAction } from "@/app/(dashboard)/yazilar/actions";
import { CoverLibrary } from "@/components/forms/cover-library";
import { FormField } from "@/components/forms/form-field";
import { FileUpload } from "@/components/forms/file-upload";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button } from "@/components/ui/button";
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
  const [mobilePanel, setMobilePanel] = useState<"content" | "settings">("content");
  const [activeLanguage, setActiveLanguage] = useState<"tr" | "en">("tr");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [libraryCover, setLibraryCover] = useState<{ id: string; url: string } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [removeCover, setRemoveCover] = useState(false);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(posts);
  const sharedPost = posts?.tr ?? posts?.en;
  const { register, control, handleSubmit, setValue, getValues, setError, clearErrors, formState: { errors } } = useForm<PostFormValues>({
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
  const coverPreview = libraryCover?.url ?? (removeCover ? null : sharedPost?.cover_path);
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
      const result = sharedPost ? await updatePostAction(sharedPost.id, values, coverImage, removeCover, libraryCover?.id ?? null) : await createPostAction(values, coverImage, libraryCover?.id ?? null);
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

  function saveDraft() {
    clearErrors();
    const parsed = postSchema.safeParse({ ...getValues(), status: "draft" });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setError(issue.path.join(".") as Parameters<typeof setError>[0], { message: issue.message });
      const language = parsed.error.issues[0]?.path[0];
      if (language === "tr" || language === "en") { setActiveLanguage(language); setMobilePanel("content"); }
      else setMobilePanel("settings");
      return;
    }
    onSubmit(parsed.data);
  }

  const onInvalid = (formErrors: typeof errors) => {
    if (formErrors.tr || formErrors.en) { setActiveLanguage(formErrors.tr ? "tr" : "en"); setMobilePanel("content"); }
    else setMobilePanel("settings");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="admin-post-form grid gap-5 pb-24 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:pb-0" noValidate>
      <div className="admin-composer-heading xl:col-span-2">
        <Link href="/yazilar" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted"><ChevronLeft size={18} aria-hidden="true" />Yazılara dön</Link>
        <div className="admin-composer-tabs" role="group" aria-label="Yazı düzenleme adımları">
          <button type="button" aria-pressed={mobilePanel === "content"} onClick={() => setMobilePanel("content")}>1. İçerik</button>
          <button type="button" aria-pressed={mobilePanel === "settings"} onClick={() => setMobilePanel("settings")}>2. Yayın ayarları</button>
        </div>
      </div>
      <div className={`card min-w-0 space-y-5 admin-composer-content ${mobilePanel !== "content" ? "admin-panel-hidden" : ""}`}>
        <div className="admin-composer-language flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title hidden lg:block">İçerik</h2>
          </div>
          <div role="group" aria-label="İçerik dili" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1 sm:w-64">
              {(["tr", "en"] as const).map((language) => (
                <button key={language} type="button" aria-pressed={activeLanguage === language} onClick={() => setActiveLanguage(language)} className={`min-h-10 rounded-full text-sm font-semibold transition-[color,background-color,box-shadow] ${activeLanguage === language ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"}`}>
                  {language === "tr" ? "Türkçe" : "English"}
                </button>
              ))}
          </div>
        </div>
        <FormField
          label={activeLanguage === "tr" ? "Türkçe içerik" : "İngilizce içerik"}
          hideLabel
          htmlFor={`${activeLanguage}-body`}
          error={errors[activeLanguage]?.body?.message}
        >
          <Controller
            name={`${activeLanguage}.body`}
            control={control}
            render={({ field }) => <RichTextEditor key={activeLanguage} id={`${activeLanguage}-body`} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} showToolbar onPasteText={importBilingualPaste} />}
          />
        </FormField>
        <p className="text-sm text-muted">Türkçe ve İngilizce metni birlikte yapıştırabilirsiniz. Daha sonra devam etmek için taslak kaydedin.</p>
        <Button type="button" variant="secondary" className="admin-composer-next w-full" onClick={() => { setMobilePanel("settings"); window.scrollTo({ top: 0, behavior: "instant" }); }}>Kapak ve yayın ayarları<ChevronRight size={18} aria-hidden="true" /></Button>
      </div>

      <div className={`space-y-5 admin-composer-settings ${mobilePanel !== "settings" ? "admin-panel-hidden" : ""}`}>
        <div className="card">
          <FormField label="Kaynak bağlantısı" htmlFor="sourceUrl" error={errors.sourceUrl?.message}>
            <Input id="sourceUrl" type="url" placeholder="https://..." {...register("sourceUrl")} />
          </FormField>
        </div>
        <div className="card space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Kapak görseli <span className="font-normal text-muted">(isteğe bağlı)</span></h3>
            <FileUpload
              key={uploadKey}
              onChange={(file) => { setCoverImage(file); if (file) { setRemoveCover(false); setLibraryCover(null); } }}
              preview={coverPreview ? (isOptimizableImage(coverPreview)
                ? <Image src={coverPreview} alt="Mevcut kapak görseli" fill sizes="360px" className="object-cover" />
                // eslint-disable-next-line @next/next/no-img-element -- host is outside the image allow-list
                : <img src={coverPreview} alt="Mevcut kapak görseli" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />) : undefined}
            />
            <Button type="button" variant="outline" className="mt-3 w-full" disabled={pending} onClick={() => setLibraryOpen(true)}><Images className="size-4" aria-hidden="true" />Kütüphaneden seç</Button>
            {coverPreview && !coverImage ? <button type="button" onClick={() => { setLibraryCover(null); setRemoveCover(true); }} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-danger hover:underline">Görseli kaldır</button> : null}
            {removeCover && !coverImage ? <button type="button" onClick={() => setRemoveCover(false)} className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-muted hover:text-ink">Mevcut görseli geri getir</button> : null}
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">Yayın zamanı</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 flex min-h-12 cursor-pointer items-center gap-2 rounded-field border px-3 py-3 text-sm font-semibold transition ${status === "published" ? "border-ink bg-surface text-ink" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink"}`}>
                <input type="radio" value="published" className="sr-only" {...register("status")} />
                <Check className="size-4" aria-hidden="true" /> Şimdi
              </label>
              <label className={`has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 flex min-h-12 cursor-pointer items-center gap-2 rounded-field border px-3 py-3 text-sm font-semibold transition ${status === "scheduled" ? "border-ink bg-surface text-ink" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink"}`}>
                <input type="radio" value="scheduled" className="sr-only" {...register("status", {
                  onChange: () => {
                    if (!getValues("scheduledAt")) {
                      setValue("scheduledAt", localDateTime(new Date().toISOString()), { shouldDirty: true });
                      clearErrors("scheduledAt");
                    }
                  },
                })} />
                <Clock3 className="size-4" aria-hidden="true" /> Planla
              </label>
            </div>
            {errors.status?.message ? <p className="mt-2 text-xs text-danger">{errors.status.message}</p> : null}
          </fieldset>
          {sharedPost?.status === "published" && status === "published" && <FormField label="Yayın tarihi" htmlFor="publishedAt" error={errors.publishedAt?.message} hint="Akış sıralaması bu tarih ve saate göre güncellenir."><Input id="publishedAt" type="datetime-local" {...register("publishedAt")} /></FormField>}
          {status === "scheduled" && <FormField label="Yayın tarihi" htmlFor="scheduledAt" error={errors.scheduledAt?.message}><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} /></FormField>}
        </div>

      </div>
      <div className="admin-save-bar admin-chrome">
        <Button type="button" variant="secondary" disabled={pending} onClick={saveDraft}>Taslak</Button>
          <Button disabled={pending} className="min-w-40">
            <Save className="size-4" aria-hidden="true" />
            {pending ? (editing ? "Güncelleniyor…" : "Kaydediliyor…") : (editing && sharedPost?.status !== "draft" ? "Kaydet" : status === "scheduled" ? "Planla" : "Yayınla")}
          </Button>
      </div>

      {libraryOpen ? <CoverLibrary onClose={() => setLibraryOpen(false)} onSelect={item => {
        setLibraryCover(item); setCoverImage(null); setRemoveCover(false); setUploadKey(key => key + 1); setLibraryOpen(false);
      }} /> : null}
    </form>
  );
}
