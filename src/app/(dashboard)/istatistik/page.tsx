import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsDashboard } from "@/components/features/analytics/analytics-dashboard";
import { getAnalytics, missingAnalyticsEnv, type AnalyticsRange } from "@/services/analytics";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ aralik?: string | string[] }> }) {
  const query = await searchParams;
  const value = Array.isArray(query.aralik) ? query.aralik[0] : query.aralik;
  const range: AnalyticsRange = value === "1" ? 1 : value === "7" ? 7 : value === "all" ? 365 : 30;
  const analytics = await getAnalytics(range);
  return <AppShell active="/istatistik"><PageHeader title="İstatistik" /><AnalyticsDashboard analytics={analytics} range={range} missingEnv={missingAnalyticsEnv()} /></AppShell>;
}
