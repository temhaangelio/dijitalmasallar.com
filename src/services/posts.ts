import { createClient } from "@/lib/supabase/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { demoPosts } from "@/lib/constants/demo-data";
import { parsePostContent } from "@/lib/post-content";
import { isUuid } from "@/lib/utils";
import type { Post } from "@/types/database";

type PostRow = { id: string; content_tr: string; content_en: string; legacy_english_id: string | null; source_url: string | null; cover_path: string | null; featured: boolean; ai_generated_image: boolean; created_at: string; author_id: string | null };
const postColumns = "id,content_tr,content_en,legacy_english_id,source_url,cover_path,featured,ai_generated_image,created_at,author_id";
export type PostSort = "newest" | "oldest" | "title-asc" | "title-desc";
export type PostPublicationFilter = "all" | "published" | "scheduled";

function mapPost(row: PostRow, language: "tr" | "en" = "tr"): Post {
  const content = parsePostContent(language === "en" ? row.content_en : row.content_tr);
  const scheduled = new Date(row.created_at).getTime() > Date.now();
  return {
    id: row.id,
    author_id: row.author_id ?? "",
    title: content.title,
    slug: row.id,
    excerpt: content.excerpt,
    body: content.body,
    language,
    status: scheduled ? "scheduled" : "published",
    cover_path: row.cover_path,
    source_url: row.source_url,
    featured: row.featured,
    ai_generated_image: row.ai_generated_image,
    published_at: scheduled ? null : row.created_at,
    scheduled_at: scheduled ? row.created_at : null,
    reads: 0,
    created_at: row.created_at,
    updated_at: row.created_at,
  };
}

export async function getPosts(page = 1, pageSize = 20, language: "tr" | "en" = "tr"): Promise<Post[]> {
  if (!isSupabaseConfigured()) return demoPosts.slice((page - 1) * pageSize, page * pageSize);
  try {
    const safePageSize = Math.min(Math.max(Math.floor(pageSize), 1), 500);
    const from = (Math.max(Math.floor(page), 1) - 1) * safePageSize;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(postColumns)
      .lte("created_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .range(from, from + safePageSize - 1);
    if (error) throw error;
    return (data as PostRow[]).map((row) => mapPost(row, language));
  } catch {
    return [];
  }
}

export type PostsPageResult = { posts: Post[]; total: number; page: number; totalPages: number };

const postSorts: readonly PostSort[] = ["newest", "oldest", "title-asc", "title-desc"];

function demoPage(page: number, pageSize: number, language: "tr" | "en", search = "", status: PostPublicationFilter = "all"): PostsPageResult {
  const needle = search.trim().toLocaleLowerCase("tr");
  const localizedPosts = demoPosts.filter((post) => {
    if (post.language !== language) return false;
    if (status !== "all" && post.status !== status) return false;
    return !needle || `${post.title} ${post.excerpt} ${post.body}`.toLocaleLowerCase("tr").includes(needle);
  });
  const totalPages = Math.max(Math.ceil(localizedPosts.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  return { posts: localizedPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: localizedPosts.length, page: currentPage, totalPages };
}

const titleColumn = { tr: "content_tr", en: "content_en" } as const;

/**
 * Titles are derived in JavaScript from the markdown body, so the database cannot sort by them
 * directly. Ordering on the content column is the closest equivalent: rows that carry a title start
 * with `# <title>`, so they sort the same way. The previous implementation ordered by `content`,
 * a column dropped in the translation-merge migration, which made every title sort fail.
 */
function quotedLikePattern(value: string) {
  const escaped = value.replace(/[\\%_"]/g, "\\$&");
  return `"%${escaped}%"`;
}

async function fetchAdminPostRows(page: number, pageSize: number, sort: PostSort, language: "tr" | "en", search = "", status: PostPublicationFilter = "all") {
  const access = await getAuthorizedAdminClient();
  if (!access) throw new Error("Admin session is unavailable.");
  const from = (page - 1) * pageSize;
  let query = access.admin.from("posts").select(postColumns, { count: "exact" });
  const normalizedSearch = search.trim().slice(0, 120);
  if (normalizedSearch) {
    const pattern = quotedLikePattern(normalizedSearch);
    query = query.or(`content_tr.ilike.${pattern},content_en.ilike.${pattern}`);
  }
  const now = new Date().toISOString();
  if (status === "published") query = query.lte("created_at", now);
  else if (status === "scheduled") query = query.gt("created_at", now);
  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "title-asc") query = query.order(titleColumn[language], { ascending: true });
  else if (sort === "title-desc") query = query.order(titleColumn[language], { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  const rows = (data ?? []) as PostRow[];
  return { rows, total: count ?? rows.length };
}

function clampPageSize(pageSize: number) { return Math.min(Math.max(Math.floor(pageSize), 1), 100); }
function clampPage(page: number) { return Math.max(Math.floor(page), 1); }
function safeSort(sort: PostSort): PostSort { return postSorts.includes(sort) ? sort : "newest"; }

export async function getPostsPage(page = 1, pageSize = 20, language: "tr" | "en" = "tr", sort: PostSort = "newest", search = "", status: PostPublicationFilter = "all"): Promise<PostsPageResult> {
  const safePageSize = clampPageSize(pageSize);
  const requestedPage = clampPage(page);
  if (!isSupabaseConfigured()) return demoPage(requestedPage, safePageSize, language, search, status);
  try {
    const { rows, total } = await fetchAdminPostRows(requestedPage, safePageSize, safeSort(sort), language, search, status);
    const totalPages = Math.max(Math.ceil(total / safePageSize), 1);
    if (requestedPage > totalPages) return getPostsPage(totalPages, safePageSize, language, sort, search, status);
    return { posts: rows.map((row) => mapPost(row, language)), total, page: requestedPage, totalPages };
  } catch {
    return demoPage(requestedPage, safePageSize, language, search, status);
  }
}

/**
 * Turkish and English live in two columns of the same row, so one query serves both tabs of the
 * posts table. Fetching each language separately doubled the round-trips and the exact-count scans.
 */
export async function getBilingualPostsPage(page = 1, pageSize = 20, sort: PostSort = "newest"): Promise<Record<"tr" | "en", PostsPageResult>> {
  const safePageSize = clampPageSize(pageSize);
  const requestedPage = clampPage(page);
  if (!isSupabaseConfigured()) return { tr: demoPage(requestedPage, safePageSize, "tr"), en: demoPage(requestedPage, safePageSize, "en") };
  try {
    const { rows, total } = await fetchAdminPostRows(requestedPage, safePageSize, safeSort(sort), "tr");
    const totalPages = Math.max(Math.ceil(total / safePageSize), 1);
    if (requestedPage > totalPages) return getBilingualPostsPage(totalPages, safePageSize, sort);
    const shared = { total, page: requestedPage, totalPages };
    return {
      tr: { posts: rows.map((row) => mapPost(row, "tr")), ...shared },
      en: { posts: rows.map((row) => mapPost(row, "en")), ...shared },
    };
  } catch {
    return { tr: demoPage(requestedPage, safePageSize, "tr"), en: demoPage(requestedPage, safePageSize, "en") };
  }
}

/** Powers the accurate "Planlı" tab count without pulling the scheduled rows themselves. */
export async function getScheduledPostCount(): Promise<number> {
  if (!isSupabaseConfigured()) return demoPosts.filter((post) => post.status === "scheduled").length;
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return 0;
    const { count, error } = await access.admin.from("posts").select("id", { count: "exact", head: true }).gt("created_at", new Date().toISOString());
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export async function getPostTranslationsById(id: string): Promise<Partial<Record<"tr" | "en", Post>> | null> {
  if (!isUuid(id)) return null;
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return null;
    const { data, error } = await access.admin
      .from("posts")
      .select(postColumns)
      .or(`id.eq.${id},legacy_english_id.eq.${id}`)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as PostRow;
    return { tr: mapPost(row, "tr"), en: mapPost(row, "en") };
  } catch {
    return null;
  }
}

export async function getPublishedPostById(id: string, language?: "tr" | "en"): Promise<Post | null> {
  if (!isUuid(id) || !isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(postColumns)
      .or(`id.eq.${id},legacy_english_id.eq.${id}`)
      .lte("created_at", new Date().toISOString())
      .maybeSingle();
    if (error || !data) return null;
    const row = data as PostRow;
    const resolvedLanguage = language ?? (row.legacy_english_id === id ? "en" : "tr");
    return mapPost(row, resolvedLanguage);
  } catch {
    return null;
  }
}

export async function getNextPublishedPost(createdAt: string, language: "tr" | "en"): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(postColumns)
      .lt("created_at", createdAt)
      .lte("created_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapPost(data as PostRow, language);
  } catch {
    return null;
  }
}

export type DashboardPostStats = {
  total: number;
  publishedThisWeek: number;
  publishedThisMonth: number;
  publishedDaysThisMonth: number[];
  scheduled: Post[];
  recent: Post[];
};

export async function getDashboardPostStats(): Promise<DashboardPostStats> {
  const empty = { total: 0, publishedThisWeek: 0, publishedThisMonth: 0, publishedDaysThisMonth: [], scheduled: [], recent: [] };
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return empty;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    const year = Number(value("year"));
    const month = Number(value("month"));
    const day = Number(value("day"));
    const localDay = new Date(Date.UTC(year, month - 1, day));
    const weekday = localDay.getUTCDay() || 7;
    const weekStartDay = new Date(localDay); weekStartDay.setUTCDate(localDay.getUTCDate() - weekday + 1);
    const isoAtIstanbulMidnight = (date: Date) => `${date.toISOString().slice(0, 10)}T00:00:00+03:00`;
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01T00:00:00+03:00`;
    const nextMonth = new Date(Date.UTC(year, month, 1));
    const nextMonthStart = isoAtIstanbulMidnight(nextMonth);
    const nowIso = now.toISOString();

    const [totalResult, weekResult, monthResult, scheduledResult, recentResult] = await Promise.all([
      access.admin.from("posts").select("id", { count: "exact", head: true }),
      access.admin.from("posts").select("id", { count: "exact", head: true }).gte("created_at", isoAtIstanbulMidnight(weekStartDay)).lte("created_at", nowIso),
      access.admin.from("posts").select("created_at").gte("created_at", monthStart).lte("created_at", nowIso),
      access.admin.from("posts").select(postColumns).gt("created_at", nowIso).lt("created_at", nextMonthStart).order("created_at").limit(20),
      access.admin.from("posts").select(postColumns).order("created_at", { ascending: false }).limit(3),
    ]);
    if (totalResult.error || weekResult.error || monthResult.error || scheduledResult.error || recentResult.error) return empty;
    const monthDates = monthResult.data ?? [];
    return {
      total: totalResult.count ?? 0,
      publishedThisWeek: weekResult.count ?? 0,
      publishedThisMonth: monthDates.length,
      publishedDaysThisMonth: [...new Set(monthDates.map((row) => new Date(row.created_at).getDate()))],
      scheduled: (scheduledResult.data as PostRow[]).map((row) => mapPost(row, "tr")),
      recent: (recentResult.data as PostRow[]).map((row) => mapPost(row, "tr")),
    };
  } catch {
    return empty;
  }
}
