"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createNewsletterAction } from "@/app/(dashboard)/e-bulten/actions";
import { FormField } from "@/components/forms/form-field";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import { newsletterSchema, type NewsletterFormValues } from "@/lib/validations/newsletter";

export function NewsletterForm({ activeSubscribers }: { activeSubscribers: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState: { errors } } = useForm<NewsletterFormValues>({ resolver: zodResolver(newsletterSchema), defaultValues: { subject: "", previewText: "", content: "", status: "draft", scheduledAt: "" } });
  const status = useWatch({ control, name: "status" });
  const onSubmit = (values: NewsletterFormValues) => startTransition(async () => {
    const result = await createNewsletterAction(values);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) { router.push("/e-bulten"); router.refresh(); }
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" noValidate>
      <div className="card space-y-5">
        <h2 className="section-title">Bülten içeriği</h2>
        <FormField label="Konu" htmlFor="subject" error={errors.subject?.message}><Input id="subject" placeholder="Bu haftanın öne çıkanları" {...register("subject")} /></FormField>
        <FormField label="Ön izleme metni" htmlFor="previewText" error={errors.previewText?.message} hint="E-posta kutusunda konu satırının yanında görünür."><Textarea id="previewText" className="min-h-24" placeholder="Okuyucunun bülteni açmadan göreceği kısa açıklama" {...register("previewText")} /></FormField>
        <FormField label="İçerik" htmlFor="content" error={errors.content?.message} hint="Metni seçip araç çubuğundan biçim uygulayabilirsiniz."><Controller name="content" control={control} render={({ field }) => <RichTextEditor id="content" name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} /></FormField>
      </div>
      <aside className="space-y-5"><div className="card space-y-5">
        <h2 className="section-title">Gönderim</h2>
        <div className="rounded-2xl bg-[#f5f5f5] p-4"><span className="text-sm text-[#767676]">Aktif alıcı</span><strong className="mt-1 block text-3xl tracking-[-.04em]">{activeSubscribers.toLocaleString("tr-TR")}</strong></div>
        <FormField label="Durum" htmlFor="status" error={errors.status?.message}><Select id="status" {...register("status")}><option value="draft">Taslak olarak kaydet</option><option value="scheduled">Gönderimi planla</option></Select></FormField>
        {status === "scheduled" ? <FormField label="Gönderim tarihi" htmlFor="scheduledAt" error={errors.scheduledAt?.message}><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} /></FormField> : null}
        <p className="text-[13px] leading-relaxed text-[#a1a1a1]">Bülten kaydı Supabase’e kaydedilir. Planlı kayıtlar seçtiğiniz gönderim zamanıyla listelenir.</p>
        <div className="grid grid-cols-2 gap-2"><Link href="/e-bulten" className={buttonVariants({ variant: "secondary" })}>Vazgeç</Link><Button disabled={pending}>{pending ? "Kaydediliyor…" : status === "scheduled" ? "Bülteni planla" : "Taslağı kaydet"}</Button></div>
      </div></aside>
    </form>
  );
}
