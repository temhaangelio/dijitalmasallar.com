import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/segmented";
import { segmentClassName } from "@/components/ui/segmented-style";
import { AiItemCard, AiItemRow } from "@/components/features/ai/ai-item-card";
import { AiSourcesPanel } from "@/components/features/ai/ai-sources-panel";
import { AiToolbar } from "@/components/features/ai/ai-toolbar";
import { aiCategories } from "@/lib/ai/summarize";
import { getQueueCounts, getRecentRuns, isSummarizerConfigured, listQueue, listSources, summarizerModel } from "@/services/ai-desk";
import { getSiteSettings } from "@/services/settings";

/** The queue changes on every cron firing, so nothing on this page may be served from a cache. */
export const dynamic = "force-dynamic";

const tabs = [
  ["kuyruk", "Onay kuyruğu"],
  ["kaynaklar", "Kaynaklar"],
  ["arsiv", "Arşiv"],
] as const;

type Tab = (typeof tabs)[number][0];

function runNote(run: { kind: string; startedAt: string; checked: number; added: number; processed: number; failed: number } | undefined) {
  if (!run) return "henüz çalışmadı";
  const minutes = Math.round((Date.now() - new Date(run.startedAt).getTime()) / 60_000);
  const when = minutes < 1 ? "az önce" : minutes < 60 ? `${minutes} dk önce` : `${Math.round(minutes / 60)} saat önce`;
  const what = run.kind === "collect" ? `${run.added} yeni içerik` : `${run.processed} özet`;
  return `son çalışma ${when} · ${what}${run.failed ? ` · ${run.failed} hata` : ""}`;
}

export default async function AiDeskPage({ searchParams }: { searchParams: Promise<{ sekme?: string }> }) {
  const [params, settings] = await Promise.all([searchParams, getSiteSettings()]);
  if (!settings.moduleAi) redirect("/dashboard");

  const tab: Tab = tabs.some(([id]) => id === params.sekme) ? params.sekme as Tab : "kuyruk";
  const [counts, sources, runs] = await Promise.all([getQueueCounts(), listSources(), getRecentRuns(1)]);

  const [queue, rejected, skipped, failed] = await Promise.all([
    tab === "kuyruk" ? listQueue("waiting") : Promise.resolve([]),
    tab === "arsiv" ? listQueue("rejected", 30) : Promise.resolve([]),
    tab === "arsiv" ? listQueue("skipped", 30) : Promise.resolve([]),
    tab === "arsiv" ? listQueue("failed", 30) : Promise.resolve([]),
  ]);

  return (
    <AppShell active="/yapay-zeka">
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader
          title="Yapay Zekâ"
          note={`${counts.waiting} not onay bekliyor · ${sources.length} kaynak · ${runNote(runs[0])}`}
          actions={<AiToolbar pendingCount={counts.new} />}
        />

        {!isSummarizerConfigured() && (
          <div className="card mb-5 border-danger-surface-2 bg-danger-surface p-4 text-[14px] text-danger">
            <strong>ANTHROPIC_API_KEY tanımlı değil.</strong> Kaynaklar taranabilir, ancak özet üretilemez.
          </div>
        )}

        <Segmented role="group" label="Görünüm" className="mb-5 w-fit">
          {tabs.map(([id, label]) => {
            const count = id === "kuyruk" ? counts.waiting : id === "kaynaklar" ? sources.length : counts.rejected + counts.skipped + counts.failed;
            return (
              <Link key={id} href={`/yapay-zeka?sekme=${id}`} data-active={tab === id} className={segmentClassName(tab === id)}>
                {label}
                <span className={tab === id ? "text-on-dark" : "text-muted"}>{count}</span>
              </Link>
            );
          })}
        </Segmented>

        {tab === "kuyruk" && (
          queue.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-[15px] font-semibold text-ink">Onay bekleyen not yok.</p>
              <p className="mt-1.5 text-[14px] text-muted">
                {counts.new > 0
                  ? `${counts.new} içerik özetlenmeyi bekliyor.`
                  : sources.length === 0
                    ? "Önce “Kaynaklar” sekmesinden resmi bir kaynak ekleyin."
                    : "Kaynaklar tarandı, yeni haber çıkmadı."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {queue.map((item) => <AiItemCard key={item.id} item={item} categories={aiCategories} />)}
            </div>
          )
        )}

        {tab === "kaynaklar" && <AiSourcesPanel sources={sources} categories={aiCategories} />}

        {tab === "arsiv" && (
          <div className="flex flex-col gap-6">
            {[
              ["Haber değeri görülmedi", skipped, false, `${summarizerModel} bu içerikleri yayına uygun bulmadı.`],
              ["Reddedilenler", rejected, false, "Reddedilen kayıtlar, aynı haberin tekrar kuyruğa girmesini engeller."],
              ["Başarısız", failed, true, "Sayfası okunamayan içerikler. Tekrar denenebilir."],
            ].map(([title, items, retryable, description]) => {
              const list = items as typeof rejected;
              if (!list.length) return null;
              return (
                <section key={title as string}>
                  <h2 className="text-[15px] font-semibold text-ink">{title as string}</h2>
                  <p className="mt-1 mb-3 text-[13px] text-muted">{description as string}</p>
                  <div className="flex flex-col gap-2">
                    {list.map((item) => <AiItemRow key={item.id} item={item} note={item.note || item.category || "—"} retryable={retryable as boolean} />)}
                  </div>
                </section>
              );
            })}
            {!rejected.length && !skipped.length && !failed.length && (
              <div className="card p-10 text-center text-[14px] text-muted">Arşivde kayıt yok.</div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
