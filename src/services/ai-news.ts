import "server-only";

import { randomUUID } from "node:crypto";
import { getAiAgentInstructions, getAiDiscovery, hasAiCandidateUrl, hasAiDiscoveryUrl, hasIgnoredAiDiscoveryUrl, insertAiCandidate, insertAiDiscovery, listUntranslatedAiDiscoveries, removeAiDiscovery, setAiDiscoveryTitleTr } from "@/lib/ai-news/local-db";
import { officialAiSources, sourceForUrl } from "@/lib/ai-news/sources";
import type { OfficialAiSource } from "@/lib/ai-news/types";

const deepseekUrl = "https://api.deepseek.com/chat/completions";
const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";
const recencyMs = 7 * 24 * 60 * 60 * 1000;
const articlePath = /\/(newsroom|news|blog|stories|story|press|research|technology|artificial-intelligence|ai|discover|index)(?:\/|$|-)/i;

type DiscoveredArticle = { source: OfficialAiSource; url: string; title: string; publishedAt: string; text: string };
type AiDraft = { title_tr: string; title_en: string; content_tr: string; content_en: string };
type DeepSeekResponse = { choices?: { finish_reason?: string; message?: { content?: string | null } }[]; error?: { message?: string } };

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function plainText(html: string) {
  return decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " "))
    .trim();
}

function normalizedUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase() === "utc" || key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  }
  return url.toString();
}

async function fetchHtml(url: string) {
  const source = sourceForUrl(url);
  if (!source) throw new Error("İzin verilmeyen kaynak adresi.");
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "diji.news-local-editor/1.0" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${source.name} ${response.status} yanıtı verdi.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error("Kaynak HTML döndürmedi.");
  return (await response.text()).slice(0, 2_000_000);
}

function linksFromIndex(html: string, source: OfficialAiSource) {
  const links = new Map<string, string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = normalizedUrl(new URL(decodeHtml(match[1]), source.url).toString());
      const allowed = sourceForUrl(url);
      const title = plainText(match[2]);
      if (!allowed || allowed.host !== source.host || !articlePath.test(new URL(url).pathname) || title.length < 12 || title.length > 220) continue;
      if (url === normalizedUrl(source.url)) continue;
      links.set(url, title);
    } catch { /* A malformed publisher link is simply not a candidate. */ }
  }
  return [...links].slice(0, 10);
}

function publishedDate(html: string) {
  const patterns = [
    /["']datePublished["']\s*:\s*["']([^"']+)["']/i,
    /property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
    /name=["']date["'][^>]*content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const value = html.match(pattern)?.[1];
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

async function discoverFromSource(source: OfficialAiSource): Promise<DiscoveredArticle[]> {
  const indexHtml = await fetchHtml(source.url);
  const links = linksFromIndex(indexHtml, source);
  const results = await Promise.allSettled(links.map(async ([url, fallbackTitle]) => {
    const html = await fetchHtml(url);
    const publishedAt = publishedDate(html);
    if (!publishedAt || Date.now() - new Date(publishedAt).getTime() > recencyMs || new Date(publishedAt).getTime() > Date.now() + 60_000) return null;
    const title = decodeHtml(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? fallbackTitle).trim();
    const text = plainText(html).slice(0, 24_000);
    return text.length >= 400 ? { source, url, title, publishedAt, text } : null;
  }));
  return results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
}

function sentenceCount(value: string, locale: "tr" | "en") {
  return [...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(value.trim())].filter((part) => part.segment.trim()).length;
}

function validDraft(draft: AiDraft) {
  return draft.title_tr.trim().length >= 8 && draft.title_en.trim().length >= 8
    && draft.content_tr.trim().length >= 250 && draft.content_tr.trim().length <= 400
    && draft.content_en.trim().length >= 250 && draft.content_en.trim().length <= 400
    && sentenceCount(draft.content_tr, "tr") === 3 && sentenceCount(draft.content_en, "en") === 3;
}

function deepseekApiKey() {
  return process.env.DEEPSEEK_API_KEY?.trim() || "";
}

async function deepseekJson<T>(prompt: string, maxTokens: number): Promise<T> {
  const apiKey = deepseekApiKey();
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY tanımlı değil.");
  const response = await fetch(deepseekUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Yalnızca istenen JSON nesnesini döndür. Markdown veya açıklama ekleme." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      temperature: 0.2,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as DeepSeekResponse;
  if (!response.ok) {
    const detail = payload.error?.message?.trim();
    throw new Error(detail ? `DeepSeek API ${response.status}: ${detail}` : `DeepSeek API ${response.status} yanıtı verdi.`);
  }
  const choice = payload.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error("DeepSeek yanıtı tamamlanmadan kesildi.");
  const content = choice?.message?.content;
  if (!content) throw new Error("DeepSeek boş yanıt döndürdü.");
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("DeepSeek geçerli JSON döndürmedi.");
  }
}

async function createDraft(article: DiscoveredArticle, instructions: string): Promise<AiDraft | null> {
  const prompt = `Aşağıdaki resmî kaynak metninden diji.news için Türkçe ve İngilizce kısa haber yaz.
Kurallar: Her dildeki haber boşluklar dahil 250-400 karakter ve tam 3 cümle olmalı. Başlık kısa olmalı. Yalnızca kaynakta açıkça bulunan olguları kullan; yorum, övgü, tahmin, alıntı ve kaynak bağlantısı ekleme. Şirket adlarını değiştirme.
Editörün ajan talimatı: ${instructions}
Şu anahtarlarla bir JSON nesnesi döndür: title_tr, title_en, content_tr, content_en.
Kaynak: ${article.source.name}\nBaşlık: ${article.title}\nYayın tarihi: ${article.publishedAt}\nMetin: ${article.text}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const draft = await deepseekJson<AiDraft>(prompt, 1_500);
      if (validDraft(draft)) return draft;
    } catch (error) {
      if (attempt === 1 || (error instanceof Error && error.message.startsWith("DeepSeek API"))) throw error;
    }
  }
  return null;
}

export function deepseekStatus() {
  return { configured: Boolean(deepseekApiKey()), model };
}

async function translateHeadlines(titles: string[], instructions: string) {
  if (!titles.length) return [];
  const parsed = await deepseekJson<{ translations?: unknown[] }>(`Aşağıdaki teknoloji haber başlıklarını doğal ve kısa Türkçe başlıklara çevir. Özel isimleri ve ürün adlarını koru. Açıklama ekleme ve sıralamayı değiştirme. Aynı sayıda öğe içeren translations dizisine sahip bir JSON nesnesi döndür.\nEditörün ajan talimatı: ${instructions}\n${JSON.stringify(titles)}`, 2_000);
  if (!Array.isArray(parsed.translations) || parsed.translations.length !== titles.length || parsed.translations.some((title) => typeof title !== "string" || title.trim().length < 5)) {
    throw new Error("Model başlık çevirilerini geçerli biçimde döndürmedi.");
  }
  return parsed.translations.map((title) => String(title).trim());
}

function requestedHeadlineCount(instructions: string) {
  const value = instructions.match(/\b(\d{1,2})\s*(?:(?:adet|tane)\s+)?haber\b/i)?.[1];
  return Math.min(30, Math.max(1, value ? Number(value) : 10));
}

async function selectHeadlines(articles: DiscoveredArticle[], instructions: string, requested: number) {
  if (!articles.length) return [];
  const target = Math.min(requested, articles.length);
  const choices = articles.map((article, index) => ({ index, source: article.source.name, title: article.title, published_at: article.publishedAt }));
  const parsed = await deepseekJson<{ items?: unknown[] }>(`Aşağıdaki resmî kaynak haberlerini editörün ajan talimatına göre değerlendir. En güçlü ${target} haberi seç ve başlıklarını doğal, kısa Türkçe olarak yaz. Tam olarak ${target} farklı öğe döndür. Yanıt; index ve title_tr alanlarına sahip nesnelerden oluşan items dizisi olmalı. Kaynakta olmayan bilgi ekleme.\nEditörün ajan talimatı: ${instructions}\nHaberler: ${JSON.stringify(choices)}`, 3_000);
  if (!Array.isArray(parsed.items)) throw new Error("DeepSeek haber seçimini geçerli biçimde döndürmedi.");
  const selected = new Map<number, string>();
  for (const item of parsed.items) {
    if (!item || typeof item !== "object") throw new Error("DeepSeek haber seçimini geçerli biçimde döndürmedi.");
    const index = Number((item as { index?: unknown }).index);
    const titleTr = (item as { title_tr?: unknown }).title_tr;
    if (!Number.isInteger(index) || index < 0 || index >= articles.length || typeof titleTr !== "string" || titleTr.trim().length < 5) {
      throw new Error("DeepSeek haber seçimini geçerli biçimde döndürmedi.");
    }
    selected.set(index, titleTr.trim());
  }
  if (selected.size < target) {
    const missingIndexes = articles.map((_, index) => index).filter((index) => !selected.has(index)).slice(0, target - selected.size);
    const translations = await translateHeadlines(missingIndexes.map((index) => articles[index].title), instructions);
    missingIndexes.forEach((index, translationIndex) => selected.set(index, translations[translationIndex]));
  }
  return [...selected].slice(0, target).map(([index, titleTr]) => ({ article: articles[index], titleTr }));
}

export async function scanOfficialAiNews(existingUrls: ReadonlySet<string>) {
  const instructions = getAiAgentInstructions();
  const requested = requestedHeadlineCount(instructions);
  const discovered = await Promise.allSettled(officialAiSources.map(discoverFromSource));
  const articles = discovered.flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .filter((article) => !existingUrls.has(article.url) && !hasAiCandidateUrl(article.url) && !hasAiDiscoveryUrl(article.url) && !hasIgnoredAiDiscoveryUrl(article.url))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, Math.min(60, Math.max(30, requested * 3)));
  const untranslated = listUntranslatedAiDiscoveries();
  const translations = await translateHeadlines(untranslated.map((item) => item.title), instructions);
  untranslated.forEach((item, index) => setAiDiscoveryTitleTr(item.id, translations[index]));
  const selected = await selectHeadlines(articles, instructions, requested);
  for (const { article, titleTr } of selected) {
    insertAiDiscovery({
      id: randomUUID(), sourceName: article.source.name, sourceUrl: article.url, sourcePublishedAt: article.publishedAt,
      title: article.title, titleTr, articleText: article.text, createdAt: new Date().toISOString(),
    });
  }
  return { sourcesChecked: discovered.length, created: selected.length, requested, eligible: articles.length };
}

export async function generateAiCandidate(discoveryId: string) {
  const discovery = getAiDiscovery(discoveryId);
  if (!discovery) throw new Error("Haber başlığı bulunamadı.");
  const source = sourceForUrl(discovery.sourceUrl);
  if (!source) throw new Error("Kaynak artık izin listesinde değil.");
  const draft = await createDraft({
    source, url: discovery.sourceUrl, title: discovery.title,
    publishedAt: discovery.sourcePublishedAt, text: discovery.articleText,
  }, getAiAgentInstructions());
  if (!draft) throw new Error("Model 3 cümle ve 250–400 karakter kurallarını karşılayan bir taslak üretemedi.");
  insertAiCandidate({
    id: randomUUID(), sourceName: discovery.sourceName, sourceUrl: discovery.sourceUrl,
    sourcePublishedAt: discovery.sourcePublishedAt, titleTr: draft.title_tr.trim(), titleEn: draft.title_en.trim(),
    contentTr: draft.content_tr.trim(), contentEn: draft.content_en.trim(), status: "pending", createdAt: new Date().toISOString(),
  });
  removeAiDiscovery(discoveryId);
}
