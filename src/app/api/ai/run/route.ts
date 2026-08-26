import { timingSafeEqual } from "node:crypto";
import { collectStories, summarizePending } from "@/services/ai-desk";
import { getSiteSettings } from "@/services/settings";

/**
 * The scheduler's entry point. Two jobs behind one address:
 *
 *   GET /api/ai/run?job=collect    — read every active source, queue what is new. No model calls.
 *   GET /api/ai/run?job=summarize  — write notes for the queue, up to the batch ceiling.
 *
 * They are separate because their costs are not comparable. Collecting can run every fifteen
 * minutes for free; summarising is the one that spends money, so it runs less often and never
 * processes more than its ceiling in a single firing.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on its own, which is also what the
 * GitHub Actions workflow sends — so the same endpoint works under either scheduler.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  // No secret configured means the endpoint would be an open invitation to spend our API budget.
  if (!secret) return false;
  const offered = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(offered);
  // Length has to match before `timingSafeEqual`, which throws on differing lengths.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const settings = await getSiteSettings();
  if (!settings.moduleAi) {
    return Response.json({ skipped: "module_disabled" }, { status: 200 });
  }

  const job = new URL(request.url).searchParams.get("job") ?? "collect";

  try {
    if (job === "collect") {
      return Response.json({ job, ...await collectStories() });
    }
    if (job === "summarize") {
      return Response.json({ job, ...await summarizePending() });
    }
    return Response.json({ error: "unknown job" }, { status: 400 });
  } catch (cause) {
    console.error("AI desk run failed", { job, cause });
    return Response.json({ job, error: cause instanceof Error ? cause.message : "run failed" }, { status: 500 });
  }
}
