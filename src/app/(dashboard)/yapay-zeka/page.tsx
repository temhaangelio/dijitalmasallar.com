import { AppShell } from "@/components/layout/app-shell";
import { AiNewsPanel } from "@/components/features/ai-news/ai-news-panel";
import { PageHeader } from "@/components/layout/page-header";
import { listAiCandidates, listAiDiscoveries } from "@/lib/ai-news/local-db";
import { getAiScanState } from "@/lib/ai-news/job";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { notFound } from "next/navigation";
import { ollamaStatus } from "@/services/ai-news";

export default async function AiPage() {
  if (!isLocalToolAvailable()) notFound();
  const [ollama, candidates, discoveries] = await Promise.all([ollamaStatus(), Promise.resolve(listAiCandidates()), Promise.resolve(listAiDiscoveries())]);
  return (
    <AppShell active="/yapay-zeka">
      <div className="mx-auto w-full max-w-[1600px]">
        <PageHeader title="Yapay zekâ" note="Resmî kaynaklardan bulunan yerel haber taslakları." />
        <AiNewsPanel candidates={candidates} discoveries={discoveries} ollama={ollama} initialScanState={getAiScanState()} />
      </div>
    </AppShell>
  );
}
