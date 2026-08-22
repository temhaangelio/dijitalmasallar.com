import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsDashboard } from "@/components/features/analytics/analytics-dashboard";
import { getAnalytics, type AnalyticsRange } from "@/services/analytics";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ aralik?: string | string[] }> }) {
  const query = await searchParams;
  const value = Array.isArray(query.aralik) ? query.aralik[0] : query.aralik;
  const range: AnalyticsRange = value === "7" ? 7 : 30;
  const analytics = await getAnalytics(range);
  return <AppShell active="/istatistik"><PageHeader title="İstatistik" note="Vercel Web Analytics · gerçek ziyaretçi verileri" /><AnalyticsDashboard analytics={analytics} range={range} /></AppShell>;
}
