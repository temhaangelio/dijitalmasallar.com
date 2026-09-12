import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DaySummaryList } from "@/components/features/daily/day-summary";
import { segmentClass, segmentGroupClass } from "@/components/ui/admin-segment";
import { getPostDays } from "@/services/posts";
import { isSpeechAvailable, listRecordingDays } from "@/services/speech";
import { getPublishedDays } from "@/services/daily-audio";

/** The day list grows as notes are published, so nothing here is served from a cache. */
export const dynamic = "force-dynamic";

export default async function DailySummaryPage({ searchParams }: { searchParams: Promise<{ dil?: string }> }) {
  const params = await searchParams;
  const language = params.dil === "en" ? "en" : "tr";
  const speech = isSpeechAvailable();
  const [days, published] = await Promise.all([getPostDays(), getPublishedDays(language)]);
  // Which days already have something to hear: a take on this machine, or a recording on the site.
  const recorded = speech ? listRecordingDays() : [];

  return (
    <AppShell active="/gunun-ozeti">
      <PageHeader
        title="Günün özeti"
        note="Bir güne dokunun; o günün notları tek metin olarak açılır."
        actions={
          <div className={segmentGroupClass} role="group" aria-label="Özet dili">
            {(["tr", "en"] as const).map((value) => (
              <Link key={value} href={value === "tr" ? "/gunun-ozeti" : "/gunun-ozeti?dil=en"} aria-current={language === value ? "page" : undefined} className={segmentClass(language === value)}>
                {value === "tr" ? "Türkçe" : "İngilizce"}
              </Link>
            ))}
          </div>
        }
      />
      <DaySummaryList days={days} language={language} speech={speech} recorded={recorded} published={published} />
    </AppShell>
  );
}
