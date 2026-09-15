import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoPosts } from "@/lib/constants/demo-data";
import { parsePostContent } from "@/lib/post-content";
import { resolveVisitorLanguage } from "@/lib/visitor-language";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const language = resolveVisitorLanguage(params.get("lang"));
  const query = (params.get("q") ?? "").trim().slice(0, 100);
  if (query.length < 2) return Response.json({ items: [] });
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    const items = demoPosts.filter(post => post.language === language && post.created_at <= now && `${post.title} ${post.excerpt} ${post.body}`.toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language)))
      .slice(0, 20).map(post => ({ id: post.id, title: post.title, excerpt: post.excerpt, date: post.created_at }));
    return Response.json({ items });
  }
  try {
    const client = await createClient();
    const column = language === "en" ? "content_en" : "content_tr";
    // Use a single filter value, never interpolate input into PostgREST's filter grammar.
    const pattern = `%${query.replace(/[\\%_*]/gu, char => `\\${char === "*" ? "%" : char}`)}%`;
    const { data, error } = await client.from("posts").select("id,content_tr,content_en,created_at")
      .eq("is_draft", false).lte("created_at", now).ilike(column, pattern).order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    return Response.json({ items: (data ?? []).map(row => {
      const content = parsePostContent(row[column] ?? "");
      return { id: row.id, title: content.title, excerpt: content.excerpt, date: row.created_at };
    }) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: true, items: [] }, { status: 503 });
  }
}
