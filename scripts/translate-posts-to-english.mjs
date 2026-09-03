import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
}

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const model = process.env.TRANSLATION_MODEL || "gemma3:12b";
const dryRun = process.env.DRY_RUN === "1";
const limit = Math.max(0, Number(process.env.TRANSLATE_LIMIT || 0));
const concurrency = Math.min(Math.max(Number(process.env.TRANSLATE_CONCURRENCY || 3), 1), 5);

function translationId(sourceId) {
  const bytes = Buffer.from(createHash("sha1").update(`dijitalmasallar.com:english:${sourceId}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function translate(content) {
  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      prompt: [
        "Translate the Turkish news note below into natural, concise English.",
        "Return only the translation. Do not add commentary, labels, or quotation marks.",
        "Preserve the exact Markdown structure, paragraph breaks, URLs, brand names, and proper nouns.",
        "Do not translate text inside URLs. Keep the tone factual and editorial.",
        "",
        content,
      ].join("\n"),
      options: { temperature: 0.1 },
    }),
  });
  if (!response.ok) throw new Error(`Ollama request failed: ${response.status}`);
  const payload = await response.json();
  const translated = String(payload.response || "").trim();
  if (!translated) throw new Error("The translation model returned empty content.");
  return translated.replace(/^```(?:markdown)?\s*/i, "").replace(/\s*```$/, "").trim();
}

const { data, error } = await client
  .from("posts")
  .select("id,content,category,source_name,source_url,featured,show_title,show_excerpt,author_id,created_at")
  .eq("language", "tr")
  .order("created_at", { ascending: true });
if (error) throw error;

const sourcePosts = limit ? (data ?? []).slice(0, limit) : data ?? [];
let completed = 0;

const { data: existingRows, error: existingError } = await client.from("posts").select("id").eq("language", "en");
if (existingError) throw existingError;
const existingIds = new Set((existingRows ?? []).map((row) => row.id));
const pendingPosts = sourcePosts.filter((post) => !existingIds.has(translationId(post.id)));
let cursor = 0;

async function worker() {
  while (cursor < pendingPosts.length) {
    const post = pendingPosts[cursor++];
    const content = await translate(post.content);
    if (dryRun) {
      console.log(content);
      return;
    }

    const { error: upsertError } = await client.from("posts").upsert({
      id: translationId(post.id),
      content,
      category: post.category,
      language: "en",
      source_name: post.source_name,
      source_url: post.source_url,
      featured: post.featured,
      show_title: post.show_title,
      show_excerpt: post.show_excerpt,
      author_id: post.author_id,
      created_at: post.created_at,
    }, { onConflict: "id" });
    if (upsertError) throw upsertError;
    completed += 1;
    console.log(`[${completed}/${pendingPosts.length}] ${post.id}`);
  }
}

await Promise.all(Array.from({ length: dryRun ? 1 : concurrency }, () => worker()));

if (!dryRun) console.log(`Completed: ${completed} new English posts; ${sourcePosts.length - pendingPosts.length} already existed.`);
