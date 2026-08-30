"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot, Check, FileText, RefreshCw, Trash2, X } from "lucide-react";
import { deleteAiDiscoveryAction, generateAiCandidateAction, getAiScanStateAction, publishAiCandidateAction, rejectAiCandidateAction, scanAiNewsAction } from "@/app/(dashboard)/yapay-zeka/actions";
import { Button } from "@/components/ui/button";
import { aiScanStartedEvent } from "@/components/layout/ai-navigation-status";
import { showToast } from "@/components/ui/toast";
import type { AiNewsCandidate, AiNewsDiscovery } from "@/lib/ai-news/types";
import type { AiScanState } from "@/lib/ai-news/job";

export function AiNewsPanel({ candidates, discoveries, ollama, initialScanState }: { candidates: AiNewsCandidate[]; discoveries: AiNewsDiscovery[]; ollama: { online: boolean; modelReady: boolean }; initialScanState: AiScanState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(initialScanState.status === "running");

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const check = async () => {
      const state = await getAiScanStateAction();
      if (cancelled || state.status === "running") return;
      setScanning(false);
      showToast(state.message, state.status === "completed" ? "success" : "error");
      router.refresh();
    };
    const timer = window.setInterval(check, 2_000);
    void check();
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [router, scanning]);

  function run(action: () => Promise<{ success: boolean; message: string }>, id: string | null = null) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const result = await action();
        showToast(result.message, result.success ? "success" : "error");
      } catch {
        showToast("İşlem tamamlanamadı. Yerel servisleri kontrol edip tekrar deneyin.", "error");
      } finally {
        setBusyId(null);
      }
    });
  }

  function startScan() {
    setBusyId(null);
    startTransition(async () => {
      const result = await scanAiNewsAction();
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) {
        setScanning(true);
        window.dispatchEvent(new Event(aiScanStartedEvent));
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className={`grid size-11 place-items-center rounded-field ${ollama.online && ollama.modelReady ? "bg-success-surface text-success" : "bg-warning-surface text-warning"}`}><Bot className="size-5" aria-hidden="true" /></span>
          <div>
            <h2 className="text-base font-semibold text-ink">Qwen 3.5 9B</h2>
            <p className="mt-1 text-sm text-muted">{!ollama.online ? "Ollama çalışmıyor" : ollama.modelReady ? "Yerel model hazır" : "Model yüklü değil"}</p>
          </div>
        </div>
        <Button disabled={pending || scanning || !ollama.modelReady} onClick={startScan}>
          <RefreshCw className={`size-4 ${scanning ? "animate-spin" : ""}`} aria-hidden="true" />
          {scanning ? "Arka planda taranıyor…" : "Yeni haberleri tara"}
        </Button>
      </section>

      <section className="card">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><h2 className="section-title">Bulunan haberler</h2><p className="mt-1 text-sm text-muted">Taslak hazırlanmasını istediğiniz başlığı seçin.</p></div>
          <span className="text-sm font-semibold tabular-nums text-muted">{discoveries.length}</span>
        </div>
        {discoveries.length ? <div className="divide-y divide-line">
          {discoveries.map((discovery) => (
            <article key={discovery.id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><span>{discovery.sourceName}</span><span aria-hidden="true">·</span><span>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(discovery.sourcePublishedAt))}</span></div>
                <h3 className="text-[16px] font-semibold leading-6 text-ink">{discovery.titleTr}</h3>
                <a href={discovery.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">Kaynağı aç <ArrowUpRight className="size-3" aria-hidden="true" /></a>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" aria-label="Haberi listeden sil" title="Sil" disabled={pending} onClick={() => run(() => deleteAiDiscoveryAction(discovery.id), `delete:${discovery.id}`)} className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-danger-surface hover:text-danger disabled:opacity-50"><Trash2 className="size-4" aria-hidden="true" /></button>
                <Button variant="secondary" disabled={pending || !ollama.modelReady} onClick={() => run(() => generateAiCandidateAction(discovery.id), discovery.id)}>
                  <FileText className="size-4" aria-hidden="true" />{pending && busyId === discovery.id ? "Hazırlanıyor…" : "Taslak hazırla"}
                </Button>
              </div>
            </article>
          ))}
        </div> : <p className="rounded-field bg-surface-2/60 px-4 py-8 text-center text-sm text-muted">Henüz haber başlığı taranmadı.</p>}
      </section>

      {candidates.length ? (
        <section className="grid gap-4"><div><h2 className="section-title">Onay bekleyen taslaklar</h2><p className="mt-1 text-sm text-muted">Yalnızca onayladığınız içerikler siteye eklenir.</p></div>
          {candidates.map((candidate) => (
            <article key={candidate.id} className="card grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                  <span className="rounded-full bg-surface-2 px-3 py-1.5">{candidate.sourceName}</span>
                  <span>{candidate.sourcePublishedAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(candidate.sourcePublishedAt)) : "Tarih yok"}</span>
                </div>
                <h2 className="text-xl font-bold tracking-[-.03em] text-ink">{candidate.titleTr}</h2>
                <p className="mt-3 max-w-3xl text-[15px] leading-7 text-ink-2">{candidate.contentTr}</p>
                <details className="mt-4 rounded-field bg-surface-2 px-4 py-3">
                  <summary className="text-sm font-semibold text-ink">İngilizce içeriği göster</summary>
                  <h3 className="mt-4 font-semibold text-ink">{candidate.titleEn}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-2">{candidate.contentEn}</p>
                </details>
                <a href={candidate.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">Resmî kaynağı aç <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>
              </div>
              <div className="flex items-end justify-end gap-2 xl:flex-col xl:items-stretch xl:justify-end">
                <Button variant="secondary" disabled={pending} onClick={() => run(() => rejectAiCandidateAction(candidate.id), candidate.id)}><X className="size-4" aria-hidden="true" />Reddet</Button>
                <Button disabled={pending} onClick={() => run(() => publishAiCandidateAction(candidate.id), candidate.id)}><Check className="size-4" aria-hidden="true" />{pending && busyId === candidate.id ? "İşleniyor…" : "Onayla ve yayınla"}</Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-card bg-surface-2/55 px-6 py-14 text-center">
          <p className="text-sm text-muted">Onay bekleyen haber taslağı yok.</p>
        </div>
      )}
    </div>
  );
}
