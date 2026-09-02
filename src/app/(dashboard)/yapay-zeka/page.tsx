import { AppShell } from "@/components/layout/app-shell";
import { AiNewsPanel } from "@/components/features/ai-news/ai-news-panel";
import { PageHeader } from "@/components/layout/page-header";
import { getAiAgentInstructions, listAiCandidates, listAiDiscoveries } from "@/lib/ai-news/local-db";
import { getAiScanState } from "@/lib/ai-news/job";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { notFound } from "next/navigation";
import { deepseekStatus } from "@/services/ai-news";

export default async function AiPage() {
  if (!isLocalToolAvailable()) notFound();
  const [candidates, discoveries, instructions] = await Promise.all([Promise.resolve(listAiCandidates()), Promise.resolve(listAiDiscoveries()), Promise.resolve(getAiAgentInstructions())]);
  const deepseek = deepseekStatus();
  return (
    <AppShell active="/yapay-zeka">
      <div className="mx-auto w-full max-w-[1600px]">
        <PageHeader title="Yapay zekâ" note="Resmî kaynaklardan bulunan DeepSeek destekli haber taslakları." />
        <AiNewsPanel candidates={candidates} discoveries={discoveries} deepseek={deepseek} initialInstructions={instructions} initialScanState={getAiScanState()} />
      </div>
    </AppShell>
  );
}
