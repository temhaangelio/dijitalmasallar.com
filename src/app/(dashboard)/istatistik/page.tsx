import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsDashboard } from "@/components/features/analytics/analytics-dashboard";
import { getAnalytics, missingAnalyticsEnv, type AnalyticsRange } from "@/services/analytics";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ aralik?: string | string[] }> }) {
  const query = await searchParams;
  const value = Array.isArray(query.aralik) ? query.aralik[0] : query.aralik;
  const range: AnalyticsRange = value === "1" ? 1 : value === "7" ? 7 : value === "all" ? 365 : 30;
  const analytics = await getAnalytics(range);
  return <AppShell active="/istatistik"><PageHeader title="İstatistik" note="Okurlar, kaynaklar ve içeriklerin performansı." actions={<a href="https://vercel.com/temha-angelio-s-team/dijitalmasallar/analytics" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-[13px] font-medium text-ink-2 hover:bg-surface-2">Vercel’de aç<ArrowUpRight size={15} aria-hidden="true" /></a>} /><AnalyticsDashboard analytics={analytics} range={range} missingEnv={missingAnalyticsEnv()} /></AppShell>;
}
