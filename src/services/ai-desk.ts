import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { readArticle } from "@/lib/ai/article";
import { isAllowedStoryUrl, readSource, resolveSource, type SourceKind } from "@/lib/ai/sources";
import { isSummarizerConfigured, summarizeStory, summarizerModel } from "@/lib/ai/summarize";
import { normaliseUrl } from "@/lib/ai/url";

/**
 * The AI desk.
 *
 * Everything here runs against the service-role client: the tables carry RLS with no policies, so
 * the anon key reaches none of it, and the queue stays what it is — unpublished editorial material.
 *
 * The pipeline is deliberately split in two. Collecting is cheap and frequent and touches no model;
 * summarising is expensive and capped. Running them as one job would mean a source that suddenly
 * dumps two hundred entries turns straight into two hundred model calls.
 */

export type AiSource = {
  id: string;
  name: string;
  siteUrl: string;
  sourceUrl: string;
  kind: SourceKind;
  category: string;
  active: boolean;
  lastFetchedAt: string | null;
  lastItemAt: string | null;
  lastError: string | null;
  pendingCount: number;
};

export type AiItem = {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceSiteUrl: string;
  url: string;
  originalTitle: string;
  originalPublishedAt: string | null;
  titleTr: string;
  titleEn: string;
  summaryTr: string;
  summaryEn: string;
  category: string;
  importance: number;
  status: string;
  model: string | null;
  /** Why a story was skipped or how it failed — the archive's only useful column. */
  note: string;
  createdAt: string;
};

export type AiRunSummary = {
  kind: "collect" | "summarize";
  startedAt: string;
  finishedAt: string | null;
  checked: number;
  added: number;
  processed: number;
  failed: number;
  error: string | null;
};

/** How many stories one summarise run may pay for. The ceiling is the cost control. */
const summariseBatchLimit = 12;

/** A story older than this was news before the desk existed; collecting it now is noise. */
const maxStoryAgeDays = 5;

const sourceColumns = "id,name,site_url,source_url,kind,category,active,last_fetched_at,last_item_at,last_error";
const itemColumns = "id,source_id,url,original_title,original_published_at,title_tr,title_en,summary_tr,summary_en,category,importance,status,model,error,created_at";

export function urlHash(value: string) {
  return createHash("sha256").update(normaliseUrl(value)).digest("hex");
}

function db() {
  return createAdminClient();
}

// Sources ------------------------------------------------------------------------------------

type SourceRow = {
  id: string; name: string; site_url: string; source_url: string; kind: SourceKind; category: string;
  active: boolean; last_fetched_at: string | null; last_item_at: string | null; last_error: string | null;
};

function mapSource(row: SourceRow, pendingCount = 0): AiSource {
  return {
    id: row.id, name: row.name, siteUrl: row.site_url, sourceUrl: row.source_url, kind: row.kind,
    category: row.category, active: row.active, lastFetchedAt: row.last_fetched_at,
    lastItemAt: row.last_item_at, lastError: row.last_error, pendingCount,
  };
}

export async function listSources(): Promise<AiSource[]> {
  const supabase = db();
  const [{ data: sources }, { data: pending }] = await Promise.all([
    supabase.from("ai_sources").select(sourceColumns).order("name"),
    supabase.from("ai_items").select("source_id").in("status", ["new", "summarized"]),
  ]);
  const counts = new Map<string, number>();
  for (const row of pending ?? []) counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
  return (sources as SourceRow[] ?? []).map((row) => mapSource(row, counts.get(row.id) ?? 0));
}

/**
 * Resolving before inserting is the point: the editor finds out now whether the address can be
 * read, and by which of the three strategies, instead of watching an empty queue for a day.
 */
export async function addSource(rawUrl: string, category: string) {
  const resolved = await resolveSource(rawUrl.trim());
  const supabase = db();
  const { data, error } = await supabase.from("ai_sources").insert({
    name: resolved.name.slice(0, 100) || new URL(resolved.siteUrl).hostname,
    site_url: resolved.siteUrl,
    source_url: resolved.sourceUrl,
    kind: resolved.kind,
    category: category.slice(0, 60),
    allowed_hosts: resolved.allowedHosts,
  }).select("id,name,kind").single();

  if (error) {
    if (error.code === "23505") throw new Error("Bu kaynak zaten ekli.");
    throw new Error("Kaynak kaydedilemedi.");
  }

  const added = await storeItems(data.id, resolved.allowedHosts, resolved.items);
  return { name: data.name as string, kind: data.kind as SourceKind, added };
}

export async function removeSource(id: string) {
  const { error } = await db().from("ai_sources").delete().eq("id", id);
  if (error) throw new Error("Kaynak silinemedi.");
}

export async function setSourceActive(id: string, active: boolean) {
  const { error } = await db().from("ai_sources").update({ active }).eq("id", id);
  if (error) throw new Error("Kaynak güncellenemedi.");
}

// Collecting ---------------------------------------------------------------------------------

type IncomingItem = { url: string; title: string; excerpt: string; publishedAt: string | null };

/**
 * Insert-and-ignore-conflicts is the whole deduplication story: `url_hash` is unique, so a story
 * already seen is rejected by the database rather than by a read-then-write race between two runs.
 */
async function storeItems(sourceId: string, allowedHosts: string[], items: IncomingItem[]) {
  const cutoff = Date.now() - maxStoryAgeDays * 24 * 60 * 60 * 1000;
  const rows = items
    .filter((item) => isAllowedStoryUrl(item.url, allowedHosts))
    .filter((item) => {
      if (!item.publishedAt) return true; // A source with no dates gets the benefit of the doubt.
      const at = Date.parse(item.publishedAt);
      return !Number.isFinite(at) || at >= cutoff;
    })
    .map((item) => ({
      source_id: sourceId,
      url: item.url,
      url_hash: urlHash(item.url),
      original_title: item.title.slice(0, 300),
      original_excerpt: item.excerpt.slice(0, 2000),
      original_published_at: item.publishedAt,
    }));

  if (!rows.length) return 0;
  const { data, error } = await db()
    .from("ai_items")
    .upsert(rows, { onConflict: "url_hash", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error("İçerikler kaydedilemedi.");
  return data?.length ?? 0;
}

export type CollectResult = { checked: number; added: number; failed: number };

export async function collectStories(sourceId?: string): Promise<CollectResult> {
  const supabase = db();
  const run = await startRun("collect");

  let query = supabase.from("ai_sources").select("id,source_url,kind,allowed_hosts").eq("active", true);
  if (sourceId) query = query.eq("id", sourceId);
  const { data: sources, error } = await query;
  if (error) {
    await finishRun(run, { error: "Kaynak listesi okunamadı." });
    throw new Error("Kaynak listesi okunamadı.");
  }

  let added = 0;
  let failed = 0;
  for (const source of sources ?? []) {
    const now = new Date().toISOString();
    try {
      const items = await readSource({ sourceUrl: source.source_url, kind: source.kind, allowedHosts: source.allowed_hosts ?? [] });
      const stored = await storeItems(source.id, source.allowed_hosts ?? [], items);
      added += stored;
      const newest = items.reduce<string | null>((latest, item) => (item.publishedAt && (!latest || item.publishedAt > latest) ? item.publishedAt : latest), null);
      await supabase.from("ai_sources").update({
        last_fetched_at: now,
        last_error: null,
        ...(newest ? { last_item_at: newest } : {}),
      }).eq("id", source.id);
    } catch (cause) {
      failed += 1;
      await supabase.from("ai_sources").update({
        last_fetched_at: now,
        last_error: (cause instanceof Error ? cause.message : "Kaynak okunamadı.").slice(0, 300),
      }).eq("id", source.id);
    }
  }

  const result = { checked: sources?.length ?? 0, added, failed };
  await finishRun(run, { checked: result.checked, added, failed });
  return result;
}

// Summarising --------------------------------------------------------------------------------

export type SummarizeRunResult = { processed: number; published: number; skipped: number; failed: number };

/**
 * Reads the story page, asks for a note, and records the verdict — including "not worth
 * publishing", which is stored as `skipped` rather than deleted so the same URL is never paid for
 * twice.
 */
export async function summarizePending(limit = summariseBatchLimit): Promise<SummarizeRunResult> {
  if (!isSummarizerConfigured()) throw new Error("ANTHROPIC_API_KEY tanımlı değil.");
  const supabase = db();
  const run = await startRun("summarize");

  const { data: items, error } = await supabase
    .from("ai_items")
    .select("id,url,original_title,original_excerpt,original_published_at,source_id,ai_sources(name,category)")
    .eq("status", "new")
    .order("original_published_at", { ascending: false, nullsFirst: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) {
    await finishRun(run, { error: "Kuyruk okunamadı." });
    throw new Error("Kuyruk okunamadı.");
  }

  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items ?? []) {
    const source = (item.ai_sources ?? {}) as unknown as { name?: string; category?: string };
    try {
      const article = await readArticle(item.url);
      // The feed's own excerpt is the fallback for a page that could not be read — thin, but a
      // press release teaser is still the publisher's own description of the story.
      const text = article?.text || item.original_excerpt || "";
      if (text.length < 200) throw new Error("Sayfa metni okunamadı.");

      const result = await summarizeStory({
        sourceName: source.name ?? "",
        url: item.url,
        title: article?.title || item.original_title || "",
        text,
        publishedAt: item.original_published_at ?? article?.publishedAt ?? null,
      });

      const { summary } = result;
      if (!summary.publishable) {
        skipped += 1;
        await supabase.from("ai_items").update({
          status: "skipped",
          error: summary.skipReason.slice(0, 300) || "Haber değeri görülmedi.",
          model: result.model,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
        }).eq("id", item.id);
        continue;
      }

      published += 1;
      await supabase.from("ai_items").update({
        status: "summarized",
        title_tr: summary.titleTr,
        title_en: summary.titleEn,
        summary_tr: summary.summaryTr,
        summary_en: summary.summaryEn,
        category: summary.category || source.category || "Teknoloji",
        importance: summary.importance,
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        error: null,
        // The article page usually states a date the feed did not.
        ...(item.original_published_at ? {} : article?.publishedAt ? { original_published_at: article.publishedAt } : {}),
        ...(article?.title && !item.original_title ? { original_title: article.title } : {}),
      }).eq("id", item.id);
    } catch (cause) {
      failed += 1;
      await supabase.from("ai_items").update({
        status: "failed",
        error: (cause instanceof Error ? cause.message : "Özet üretilemedi.").slice(0, 300),
      }).eq("id", item.id);
    }
  }

  const result = { processed: items?.length ?? 0, published, skipped, failed };
  await finishRun(run, { checked: result.processed, processed: published, failed });
  return result;
}

// Queue --------------------------------------------------------------------------------------

type ItemRow = {
  id: string; source_id: string; url: string; original_title: string; original_published_at: string | null;
  title_tr: string | null; title_en: string | null; summary_tr: string | null; summary_en: string | null;
  category: string | null; importance: number | null; status: string; model: string | null; error: string | null; created_at: string;
  ai_sources?: { name?: string; site_url?: string } | null;
};

function mapItem(row: ItemRow): AiItem {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.ai_sources?.name ?? "",
    sourceSiteUrl: row.ai_sources?.site_url ?? "",
    url: row.url,
    originalTitle: row.original_title,
    originalPublishedAt: row.original_published_at,
    titleTr: row.title_tr ?? "",
    titleEn: row.title_en ?? "",
    summaryTr: row.summary_tr ?? "",
    summaryEn: row.summary_en ?? "",
    category: row.category ?? "",
    importance: row.importance ?? 0,
    status: row.status,
    model: row.model,
    note: row.error ?? "",
    createdAt: row.created_at,
  };
}

export type QueueFilter = "waiting" | "approved" | "rejected" | "skipped" | "failed";

export async function listQueue(filter: QueueFilter = "waiting", limit = 60): Promise<AiItem[]> {
  const statuses = filter === "waiting" ? ["summarized"] : [filter === "failed" ? "failed" : filter];
  const { data, error } = await db()
    .from("ai_items")
    .select(`${itemColumns},ai_sources(name,site_url)`)
    .in("status", statuses)
    .order("importance", { ascending: false, nullsFirst: false })
    .order("original_published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) return [];
  return (data as unknown as ItemRow[]).map(mapItem);
}

export type QueueCounts = Record<QueueFilter | "new", number>;

export async function getQueueCounts(): Promise<QueueCounts> {
  const { data } = await db().from("ai_items").select("status");
  const counts: QueueCounts = { waiting: 0, approved: 0, rejected: 0, skipped: 0, failed: 0, new: 0 };
  for (const row of data ?? []) {
    if (row.status === "summarized") counts.waiting += 1;
    else if (row.status === "new") counts.new += 1;
    else if (row.status in counts) counts[row.status as QueueFilter] += 1;
  }
  return counts;
}

// Approval -----------------------------------------------------------------------------------

export type ApprovalInput = {
  titleTr: string; summaryTr: string;
  titleEn: string; summaryEn: string;
  category: string;
};

/**
 * Approval writes a normal row into `posts` — the same shape `createPostAction` writes, so the note
 * inherits the feed, the detail page, search, the sitemap and the newsletter without a second
 * publishing path existing anywhere.
 *
 * The 400-character summary is both excerpt and body. A note this short has no separate body to
 * write, and inventing one would mean publishing something the model never checked.
 */
export async function approveItem(id: string, authorId: string, input: ApprovalInput) {
  const supabase = db();
  const { data: item, error } = await supabase
    .from("ai_items")
    .select("id,url,status,ai_sources(name)")
    .eq("id", id)
    .maybeSingle();
  if (error || !item) throw new Error("İçerik bulunamadı.");
  if (item.status === "approved") throw new Error("Bu içerik zaten yayınlandı.");

  const source = (item.ai_sources ?? {}) as unknown as { name?: string };
  const { data: created, error: insertError } = await supabase.from("posts").insert({
    content_tr: `# ${input.titleTr}\n\n${input.summaryTr}\n\n${input.summaryTr}`,
    content_en: `# ${input.titleEn}\n\n${input.summaryEn}\n\n${input.summaryEn}`,
    category: input.category.slice(0, 60),
    source_name: (source.name ?? "").slice(0, 100),
    source_url: item.url,
    cover_path: null,
    show_title: true,
    show_excerpt: true,
    author_id: authorId,
    created_at: new Date().toISOString(),
  }).select("id").single();

  if (insertError) {
    console.error("AI desk post insert failed", { code: insertError.code, message: insertError.message });
    throw new Error("Yazı kaydedilemedi.");
  }

  await supabase.from("ai_items").update({
    status: "approved",
    post_id: created.id,
    title_tr: input.titleTr,
    title_en: input.titleEn,
    summary_tr: input.summaryTr,
    summary_en: input.summaryEn,
    category: input.category,
    decided_at: new Date().toISOString(),
  }).eq("id", id);

  return { postId: created.id as string, titleTr: input.titleTr, titleEn: input.titleEn, summaryTr: input.summaryTr, summaryEn: input.summaryEn };
}

/** Rejected rows stay: they are the record that stops the story being collected again. */
export async function rejectItem(id: string) {
  const { error } = await db().from("ai_items")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("İçerik güncellenemedi.");
}

/** Puts a failed item back in line — a page that timed out once often reads fine an hour later. */
export async function retryItem(id: string) {
  const { error } = await db().from("ai_items")
    .update({ status: "new", error: null })
    .in("status", ["failed", "skipped"])
    .eq("id", id);
  if (error) throw new Error("İçerik güncellenemedi.");
}

// Runs ---------------------------------------------------------------------------------------

async function startRun(kind: "collect" | "summarize") {
  const { data } = await db().from("ai_runs").insert({ kind }).select("id").single();
  return data?.id as string | undefined;
}

async function finishRun(id: string | undefined, values: { checked?: number; added?: number; processed?: number; failed?: number; error?: string }) {
  if (!id) return;
  await db().from("ai_runs").update({ finished_at: new Date().toISOString(), ...values }).eq("id", id);
}

export async function getRecentRuns(limit = 6): Promise<AiRunSummary[]> {
  const { data } = await db().from("ai_runs")
    .select("kind,started_at,finished_at,checked,added,processed,failed,error")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    kind: row.kind as "collect" | "summarize",
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    checked: row.checked, added: row.added, processed: row.processed, failed: row.failed,
    error: row.error,
  }));
}

export { summarizerModel, isSummarizerConfigured };
