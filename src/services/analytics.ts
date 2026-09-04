import "server-only";

export type AnalyticsRange = 1 | 7 | 30 | 365;
type VisitRow = { timestamp?: string; environment?: string; requestPath?: string; referrerHostname?: string; country?: string; pageviews: number; visitors: number };
type AggregateResponse = { data?: VisitRow[]; error?: { message?: string } };

export type AnalyticsData = {
  days: AnalyticsRange;
  pageviews: number;
  visitors: number;
  pageviewsChange: number | null;
  visitorsChange: number | null;
  daily: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; pageviews: number; visitors: number }[];
  sources: { label: string; pageviews: number; visitors: number; percentage: number }[];
  countries: { code: string; label: string; visitors: number; percentage: number }[];
  updatedAt: string;
};

const API_URL = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const VERCEL_PROJECT = "prj_agJ1DNyO6Nx93L5LkB2HybD84632";
const VERCEL_TEAM = "team_cTqEVmnoxddvk7Srj1cf6gDO";
const aggregateLimit = 100;
const dailyRangeLimit = 62;

function dateOnly(date: Date) { return date.toISOString().slice(0, 10); }
function addDays(date: Date, amount: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + amount); return next; }

/**
 * `teamId` is optional at the request layer because genuinely personal Hobby projects do not have
 * one. This project lives in the owner's Pro workspace, which Vercel represents as a team even
 * though it is managed by one person.
 */
async function aggregate(token: string, projectId: string, teamId: string | undefined, since: string, until: string, by: string, limit: number) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), aggregateLimit);
  const params = new URLSearchParams({ projectId, since, until, by, limit: String(safeLimit) });
  if (teamId) params.set("teamId", teamId);
  const response = await fetch(`${API_URL}?${params}`, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } });
  const payload = await response.json() as AggregateResponse;
  if (!response.ok || payload.error || !Array.isArray(payload.data)) throw new Error(`Vercel Analytics ${response.status}: ${payload.error?.message ?? "Veri alınamadı."}`);
  return payload.data;
}

/**
 * The count endpoint rounds timestamps to calendar-day boundaries. Grouping by environment keeps
 * Vercel's rolling hour window and still returns one production total, matching the dashboard.
 */
async function aggregateTotals(token: string, projectId: string, teamId: string | undefined, since: string, until: string) {
  const rows = await aggregate(token, projectId, teamId, since, until, "environment", 2);
  const production = rows.find((row) => row.environment === "production") ?? rows[0];
  return { pageviews: Number(production?.pageviews) || 0, visitors: Number(production?.visitors) || 0 };
}

/** Vercel accepts at most 62 calendar days when grouping visits by day. */
async function aggregateDaily(token: string, projectId: string, teamId: string | undefined, since: Date, until: Date) {
  const requests: Promise<VisitRow[]>[] = [];
  for (let cursor = since; cursor <= until; cursor = addDays(cursor, dailyRangeLimit)) {
    const chunkUntil = new Date(Math.min(addDays(cursor, dailyRangeLimit - 1).getTime(), until.getTime()));
    const chunkDays = Math.round((chunkUntil.getTime() - cursor.getTime()) / 86_400_000) + 1;
    requests.push(aggregate(token, projectId, teamId, dateOnly(cursor), dateOnly(chunkUntil), "day", chunkDays));
  }
  return (await Promise.all(requests)).flat();
}

function change(current: number, previous: number) { if (previous === 0) return current === 0 ? 0 : null; return ((current - previous) / previous) * 100; }
function sourceLabel(value: string) { if (!value) return "Doğrudan"; if (value === "Others") return "Diğer"; return value.replace(/^www\./, ""); }

/** Only API authentication is configured manually; the project resolves from Vercel or its slug. */
const requiredEnv = ["VERCEL_ANALYTICS_TOKEN"] as const;

/**
 * Names the variables that are missing so the UI can say which one to add, instead of blaming the
 * access token for what is usually an unset project id.
 */
export function missingAnalyticsEnv(): string[] {
  return requiredEnv.filter((name) => !process.env[name]?.trim());
}

export async function getAnalytics(days: AnalyticsRange): Promise<AnalyticsData | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() || VERCEL_PROJECT;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID?.trim() || VERCEL_TEAM;
  if (!token) return null;
  try {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const currentSinceDate = new Date(now.getTime() - days * 86_400_000);
    const previousUntilDate = currentSinceDate;
    const previousSinceDate = new Date(previousUntilDate.getTime() - days * 86_400_000);
    const currentSince = currentSinceDate.toISOString();
    const currentUntil = now.toISOString();
    const chartSinceDate = addDays(today, -(days - 1));
    const [totals, dailyRows, pageRows, sourceRows, countryRows] = await Promise.all([
      aggregateTotals(token, projectId, teamId, currentSince, currentUntil),
      days === 1
        ? aggregate(token, projectId, teamId, currentSince, currentUntil, "hour", 25)
        : aggregateDaily(token, projectId, teamId, chartSinceDate, today),
      aggregate(token, projectId, teamId, currentSince, currentUntil, "requestPath", aggregateLimit),
      aggregate(token, projectId, teamId, currentSince, currentUntil, "referrerHostname", aggregateLimit),
      aggregate(token, projectId, teamId, currentSince, currentUntil, "country", aggregateLimit),
    ]);
    let previousTotals: { pageviews: number; visitors: number } | null = null;
    try {
      previousTotals = await aggregateTotals(token, projectId, teamId, previousSinceDate.toISOString(), previousUntilDate.toISOString());
    } catch (error) {
      console.warn(JSON.stringify({ level: "warn", message: "Vercel Analytics karşılaştırma dönemi kullanılamıyor", days, error: error instanceof Error ? error.message : String(error) }));
    }

    const daily = days === 1
      ? dailyRows.map((row) => ({ date: row.timestamp ?? "", pageviews: Number(row.pageviews) || 0, visitors: Number(row.visitors) || 0 }))
      : (() => {
          const dailyByDate = new Map(dailyRows.map((row) => [row.timestamp?.slice(0, 10), row]));
          return Array.from({ length: days }, (_, index) => {
            const date = dateOnly(addDays(chartSinceDate, index));
            const row = dailyByDate.get(date);
            return { date, pageviews: Number(row?.pageviews) || 0, visitors: Number(row?.visitors) || 0 };
          });
        })();
    const { pageviews, visitors } = totals;
    const visitorTotal = Math.max(visitors, 1);
    const regionNames = new Intl.DisplayNames(["tr"], { type: "region" });

    return {
      days,
      pageviews,
      visitors,
      pageviewsChange: previousTotals ? change(pageviews, previousTotals.pageviews) : null,
      visitorsChange: previousTotals ? change(visitors, previousTotals.visitors) : null,
      daily,
      topPages: pageRows.filter((row) => row.requestPath && row.requestPath !== "Others").map((row) => ({ path: row.requestPath!, pageviews: Number(row.pageviews) || 0, visitors: Number(row.visitors) || 0 })).sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews),
      sources: sourceRows.map((row) => ({ label: sourceLabel(row.referrerHostname ?? ""), pageviews: Number(row.pageviews) || 0, visitors: Number(row.visitors) || 0, percentage: ((Number(row.visitors) || 0) / visitorTotal) * 100 })).sort((a, b) => b.visitors - a.visitors),
      countries: countryRows.map((row) => { const code = row.country ?? "Others"; const countryVisitors = Number(row.visitors) || 0; return { code, label: code === "Others" ? "Diğer" : regionNames.of(code) ?? code, visitors: countryVisitors, percentage: (countryVisitors / visitorTotal) * 100 }; }).sort((a, b) => b.visitors - a.visitors),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Vercel Analytics verisi alınamadı", days, error: error instanceof Error ? error.message : String(error) }));
    return null;
  }
}
