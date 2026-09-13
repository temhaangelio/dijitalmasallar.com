import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DaySummaryList } from "@/components/features/daily/day-summary";
import { getPostDays } from "@/services/posts";
import { isSpeechAvailable, isGeminiConfigured, listRecordingDays } from "@/services/speech";
import { getPublishedDays } from "@/services/daily-audio";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function DailySummaryPage() {
  const speech = isSpeechAvailable();
  const [days, publishedTr, publishedEn, recordedTr, recordedEn] = await Promise.all([
    getPostDays(), getPublishedDays("tr"), getPublishedDays("en"),
    speech ? listRecordingDays("tr") : Promise.resolve([]),
    speech ? listRecordingDays("en") : Promise.resolve([]),
  ]);
  return (
    <AppShell active="/gunun-ozeti">
      <PageHeader title="Günün özeti" note="Türkçe ve İngilizce bülteni tek ekranda, ortak ayarlarla hazırlayın." />
      <DaySummaryList days={days} language="tr" speech={speech} recorded={[...new Set([...recordedTr, ...recordedEn])]} published={[...new Set([...publishedTr, ...publishedEn])]} geminiReady={isGeminiConfigured()} />
    </AppShell>
  );
}
