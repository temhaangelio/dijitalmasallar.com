"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPageAction, updatePageAction } from "@/app/(dashboard)/sayfalar/actions";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import type { CmsPage } from "@/services/pages";

export function PageForm({ page }: { page?: CmsPage }) {
  const router = useRouter();
  const [contentTr, setContentTr] = useState(page?.content_tr ?? "");
  const [contentEn, setContentEn] = useState(page?.content_en ?? "");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = page ? await updatePageAction(page.id, data) : await createPageAction(data);
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) router.push("/sayfalar");
    });
  }

  return <form onSubmit={submit} className="grid gap-5">
    <section className="card grid gap-5 sm:grid-cols-2">
      <label className="field"><span>Türkçe başlık</span><input name="title_tr" defaultValue={page?.title_tr} /></label>
      <label className="field"><span>İngilizce başlık</span><input name="title_en" defaultValue={page?.title_en} /></label>
      <label className="field sm:col-span-2"><span>Sayfa adresi</span><div className="flex items-center rounded-2xl bg-[#f5f5f5] px-4"><span className="text-sm text-[#999]">/sayfa/</span><input name="slug" defaultValue={page?.slug} className="!bg-transparent !px-1" placeholder="iletisim" /></div></label>
    </section>
    <section className="card"><h2 className="section-title mb-4">Türkçe içerik</h2><RichTextEditor id="page-content-tr" name="content_tr" value={contentTr} onChange={setContentTr} onBlur={() => undefined} /></section>
    <section className="card"><h2 className="section-title mb-4">İngilizce içerik</h2><RichTextEditor id="page-content-en" name="content_en" value={contentEn} onChange={setContentEn} onBlur={() => undefined} /></section>
    <section className="card grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="field"><span>Durum</span><select name="status" defaultValue={page?.status ?? "draft"}><option value="draft">Taslak</option><option value="published">Yayında</option></select></label>
      <label className="field"><span>Menü sırası</span><input name="menu_order" type="number" min="0" max="999" defaultValue={page?.menu_order ?? 0} /></label>
      <label className="flex items-center gap-3 rounded-2xl bg-[#f5f5f5] px-4 font-semibold"><input type="checkbox" name="show_in_header" defaultChecked={page?.show_in_header ?? true} className="size-5" /> Header’da göster</label>
      <label className="flex items-center gap-3 rounded-2xl bg-[#f5f5f5] px-4 font-semibold"><input type="checkbox" name="show_in_footer" defaultChecked={page?.show_in_footer ?? true} className="size-5" /> Footer’da göster</label>
    </section>
    <div className="flex justify-end"><Button disabled={pending}>{pending ? "Kaydediliyor…" : page ? "Değişiklikleri kaydet" : "Sayfayı oluştur"}</Button></div>
  </form>;
}
