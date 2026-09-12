"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, MailX, Search, Trash2, Undo2, X } from "lucide-react";
import { deleteSubscriberAction, setSubscriberStatusAction } from "@/app/(dashboard)/bulten/actions";
import { EmptyState } from "@/components/feedback/states";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { segmentClass, segmentGroupClass } from "@/components/ui/admin-segment";
import type { NewsletterListStatus, NewsletterSubscriber } from "@/services/newsletter";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

type Filter = "subscribed" | "unsubscribed" | "all";

/**
 * The list is small and never paged: an address is one short row, and the whole point of the page
 * is to see how many there are and to take one off. Filtering and searching happen here rather than
 * on the server for the same reason — the rows are already on the page.
 */
export function SubscribersList({ subscribers, status }: { subscribers: NewsletterSubscriber[]; status: NewsletterListStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("subscribed");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<NewsletterSubscriber | null>(null);

  const counts = useMemo(() => ({
    subscribed: subscribers.filter((row) => row.status === "subscribed").length,
    unsubscribed: subscribers.filter((row) => row.status === "unsubscribed").length,
    all: subscribers.length,
  }), [subscribers]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return subscribers
      .filter((row) => filter === "all" || row.status === filter)
      .filter((row) => !needle || row.email.includes(needle));
  }, [subscribers, filter, query]);

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      try {
        const result = await action();
        showToast(result.message, result.success ? "success" : "error");
        if (result.success) router.refresh();
      } catch { showToast("İşlem tamamlanamadı. Lütfen tekrar deneyin.", "error"); }
    });
  }

  /*
   * The export is built here from the rows already rendered, so it needs no second round trip and
   * no endpoint that hands out the reader list. Addresses are quoted and internal quotes doubled,
   * which is the whole of CSV escaping for this shape of data.
   */
  function exportCsv() {
    const rows = [["email", "dil", "durum", "kayit_tarihi"], ...visible.map((row) => [row.email, row.language, row.status, row.created_at])];
    const csv = rows.map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    // The BOM is what makes Excel read the Turkish characters as UTF-8 rather than as mojibake.
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ebulten-aboneleri-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (status !== "ok") {
    return (
      <div className="card">
        <EmptyState
          title={status === "missing" ? "Abone tablosu henüz yok" : "Liste alınamadı"}
          description={status === "missing"
            ? "newsletter_subscribers geçişi veritabanına uygulanmamış. Uygulandıktan sonra kayıtlar burada listelenir."
            : "Veritabanına şu anda ulaşılamıyor. Sayfayı yenileyip tekrar deneyin."}
        />
      </div>
    );
  }

  const filterTabs: { value: Filter; label: string }[] = [
    { value: "subscribed", label: "Kayıtlı" },
    { value: "unsubscribed", label: "Çıkmış" },
    { value: "all", label: "Tümü" },
  ];

  return (
    <>
      <section className="card overflow-hidden !p-0" aria-label="E-bülten aboneleri">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center">
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:order-1 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            <div className={segmentGroupClass} role="group" aria-label="Abone durumu">
              {filterTabs.map((item) => (
                <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={segmentClass(filter === item.value)}>
                  {item.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${filter === item.value ? "bg-surface-3 text-ink-2" : "text-faint"}`}>{counts[item.value].toLocaleString("tr-TR")}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:order-2 lg:min-w-0 lg:flex-1">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <Input
                type="search"
                role="searchbox"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Abonelerde ara"
                placeholder="Adreslerde ara"
                className={`h-11 [&::-webkit-search-cancel-button]:hidden ${query ? "pl-11 pr-12" : "pl-11"}`}
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Aramayı temizle" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-ink">
                  <X size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <Button type="button" variant="outline" onClick={exportCsv} disabled={!visible.length} className="h-11 shrink-0">
              <Download className="size-4" aria-hidden="true" /><span className="hidden sm:inline">CSV indir</span>
            </Button>
          </div>
        </div>

        {visible.length ? (
          <ul aria-label="Aboneler">
            {visible.map((row) => (
              <li key={row.email} className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{row.email}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                    <time dateTime={row.created_at} className="tabular-nums">{dateFormatter.format(new Date(row.created_at))}</time>
                    <span aria-hidden="true">·</span>
                    <span>{row.language === "en" ? "İngilizce" : "Türkçe"}</span>
                    {row.status === "unsubscribed" ? <><span aria-hidden="true">·</span><span className="rounded-md bg-warning-surface px-2 py-0.5 font-semibold text-warning">Çıkmış</span></> : null}
                  </p>
                </div>
                <ActionMenu
                  label={`${row.email} işlemleri`}
                  disabled={pending}
                  triggerClassName="!size-11 disabled:opacity-40"
                  items={[
                    row.status === "subscribed"
                      ? { label: "Abonelikten çıkar", icon: <MailX size={15} aria-hidden="true" />, onSelect: () => run(() => setSubscriberStatusAction(row.email, false)) }
                      : { label: "Aboneliği geri aç", icon: <Undo2 size={15} aria-hidden="true" />, onSelect: () => run(() => setSubscriberStatusAction(row.email, true)) },
                    { label: "Kaydı sil", icon: <Trash2 size={15} aria-hidden="true" />, destructive: true, separated: true, onSelect: () => setToDelete(row) },
                  ]}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={query.trim() || filter !== "all" ? "Eşleşen kayıt yok" : "Henüz abone yok"}
            description={query.trim() || filter !== "all" ? "Aramayı veya filtreyi değiştirip tekrar deneyin." : "E-bülten sayfasından ilk kayıt geldiğinde burada listelenir."}
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Kayıt silinsin mi?"
        description={toDelete ? `“${toDelete.email}” listeden kalıcı olarak silinecek. Adres yeniden kaydolabilir.` : "Bu işlem geri alınamaz."}
        confirmLabel="Kaydı sil"
        variant="destructive"
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return false;
          const result = await deleteSubscriberAction(toDelete.email);
          showToast(result.message, result.success ? "success" : "error");
          if (result.success) router.refresh();
          return result.success;
        }}
      />
    </>
  );
}
