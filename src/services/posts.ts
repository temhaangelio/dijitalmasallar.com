import { createClient } from "@/lib/supabase/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { demoPosts } from "@/lib/constants/demo-data";
import type { Post } from "@/types/database";

type PostRow = { id: string; content_tr: string; content_en: string; legacy_english_id: string | null; category: string; source_name: string | null; source_url: string | null; featured: boolean; show_title: boolean; show_excerpt: boolean; created_at: string; author_id: string | null };
const postColumns = "id,content_tr,content_en,legacy_english_id,category,source_name,source_url,featured,show_title,show_excerpt,created_at,author_id";
export type PostSort = "newest" | "oldest" | "title-asc" | "title-desc" | "category-asc";

function stripMarkdown(value: string) {
  return value.replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^#{1,3}\s+/gm, "").replace(/[*_`=]/g, "").replace(/\s+/g, " ").trim();
}

function parseContent(value: string) {
  const structured = value.match(/^#\s+([^\n]+)\n\n([^\n]+)\n\n([\s\S]+)$/);
  if (structured) return { title: structured[1].trim(), excerpt: structured[2].trim(), body: structured[3].trim() };
  const clean = stripMarkdown(value);
  const title = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || clean.slice(0, 110);
  return {
    title: title.length > 110 ? `${title.slice(0, 107).trimEnd()}…` : title,
    excerpt: clean.length > 180 ? `${clean.slice(0, 177).trimEnd()}…` : clean,
    body: value,
  };
}

function mapPost(row: PostRow, language: "tr" | "en" = "tr"): Post {
  const content = parseContent(language === "en" ? row.content_en : row.content_tr);
  const scheduled = new Date(row.created_at).getTime() > Date.now();
  return {
    id: row.id,
    author_id: row.author_id ?? "",
    title: content.title,
    slug: row.id,
    excerpt: content.excerpt,
    body: content.body,
    category: row.category,
    language,
    status: scheduled ? "scheduled" : "published",
    cover_path: null,
    source_name: row.source_name,
    source_url: row.source_url,
    published_at: scheduled ? null : row.created_at,
    scheduled_at: scheduled ? row.created_at : null,
    reads: 0,
    show_title: row.show_title !== false,
    show_excerpt: row.show_excerpt !== false,
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

export async function getPublishedPostCount() {
  if (!isSupabaseConfigured()) return demoPosts.filter((post) => post.status === "published").length;
  try {
    const supabase = await createClient();
    const { count, error } = await supabase.from("posts").select("id", { count: "exact", head: true }).lte("created_at", new Date().toISOString());
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export async function getPostsPage(page = 1, pageSize = 20, language: "tr" | "en" = "tr", sort: PostSort = "newest"): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> {
  const safePageSize = Math.min(Math.max(Math.floor(pageSize), 1), 100);
  const requestedPage = Math.max(Math.floor(page), 1);
  if (!isSupabaseConfigured()) {
    const localizedPosts = demoPosts.filter((post) => post.language === language);
    const totalPages = Math.max(Math.ceil(localizedPosts.length / safePageSize), 1);
    const currentPage = Math.min(requestedPage, totalPages);
    return {
      posts: localizedPosts.slice((currentPage - 1) * safePageSize, currentPage * safePageSize),
      total: localizedPosts.length,
      page: currentPage,
      totalPages,
    };
  }
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) throw new Error("Admin session is unavailable.");
    const from = (requestedPage - 1) * safePageSize;
    let query = access.admin
      .from("posts")
      .select(postColumns, { count: "exact" });
    if (sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (sort === "title-asc") query = query.order("content", { ascending: true });
    else if (sort === "title-desc") query = query.order("content", { ascending: false });
    else if (sort === "category-asc") query = query.order("category", { ascending: true }).order("created_at", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    const { data, count, error } = await query.range(from, from + safePageSize - 1);
    if (error) throw error;
    const total = count ?? data.length;
    const totalPages = Math.max(Math.ceil(total / safePageSize), 1);
    if (requestedPage > totalPages) return getPostsPage(totalPages, safePageSize, language, sort);
    return { posts: (data as PostRow[]).map((row) => mapPost(row, language)), total, page: requestedPage, totalPages };
  } catch {
    const localizedPosts = demoPosts.filter((post) => post.language === language);
    const totalPages = Math.max(Math.ceil(localizedPosts.length / safePageSize), 1);
    const currentPage = Math.min(requestedPage, totalPages);
    return { posts: localizedPosts.slice((currentPage - 1) * safePageSize, currentPage * safePageSize), total: localizedPosts.length, page: currentPage, totalPages };
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const access = await getAuthorizedAdminClient();
    if (!access) return null;
    const { data, error } = await access.admin.from("posts").select(postColumns).or(`id.eq.${id},legacy_english_id.eq.${id}`).maybeSingle();
    if (error || !data) return null;
    return mapPost(data as PostRow);
  } catch {
    return null;
  }
}

export async function getPostTranslationsById(id: string): Promise<Partial<Record<"tr" | "en", Post>> | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
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
  if (!/^[0-9a-f-]{36}$/i.test(id) || !isSupabaseConfigured()) return null;
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
      access.admin.from("posts").select(postColumns).order("created_at", { ascending: false }).limit(4),
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
