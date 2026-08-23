"use client";

import Link from "next/link";
import { useState } from "react";
import { deletePageAction } from "@/app/(dashboard)/sayfalar/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import type { CmsPage } from "@/services/pages";

export function PagesTable({ pages }: { pages: CmsPage[] }) {
  const [selected, setSelected] = useState<CmsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    if (!selected) return false;
    const result = await deletePageAction(selected.id);
    showToast(result.message, result.success ? "success" : "error");
    if (!result.success) setError(result.message);
    return result.success;
  }
  return <>
    <section className="card">
      {pages.length ? <div className="divide-y divide-[#ececec]">{pages.map((page) => <article key={page.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><strong>{page.title_tr || page.title_en}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${page.status === "published" ? "bg-[#effaf3] text-[#18794e]" : "bg-[#f1f1f1] text-[#777]"}`}>{page.status === "published" ? "YAYINDA" : "TASLAK"}</span></div><p className="mt-1 text-sm text-[#999]">/sayfa/{page.slug} · sıra {page.menu_order} · {page.show_in_header ? "header" : "header kapalı"} · {page.show_in_footer ? "footer" : "footer kapalı"}</p></div><div className="flex gap-2"><Link href={`/sayfa/${page.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>Görüntüle</Link><Link href={`/sayfalar/${page.id}/duzenle`} className={buttonVariants({ variant: "outline", size: "sm" })}>Düzenle</Link><Button variant="destructive" size="sm" onClick={() => { setError(null); setSelected(page); }}>Sil</Button></div></article>)}</div> : <p className="py-10 text-center text-[#777]">Henüz sayfa oluşturulmadı.</p>}
    </section>
    <ConfirmDialog open={Boolean(selected)} title="Sayfa silinsin mi?" description={selected ? `“${selected.title_tr || selected.title_en}” kalıcı olarak silinecek.` : ""} confirmLabel="Sayfayı sil" variant="destructive" error={error} onOpenChange={(open) => !open && setSelected(null)} onConfirm={remove} />
  </>;
}
