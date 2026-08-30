import "server-only";

import { randomUUID } from "node:crypto";
import { getAiDiscovery, hasAiCandidateUrl, hasAiDiscoveryUrl, insertAiCandidate, insertAiDiscovery, listUntranslatedAiDiscoveries, removeAiDiscovery, setAiDiscoveryTitleTr } from "@/lib/ai-news/local-db";
import { officialAiSources, sourceForUrl } from "@/lib/ai-news/sources";
import type { AiNewsCandidate, OfficialAiSource } from "@/lib/ai-news/types";

const ollamaUrl = "http://127.0.0.1:11434";
const model = "qwen3.5:9b";
const recencyMs = 7 * 24 * 60 * 60 * 1000;
const articlePath = /\/(newsroom|news|blog|stories|story|press|research|technology|artificial-intelligence|ai|discover|index)(?:\/|$|-)/i;

type DiscoveredArticle = { source: OfficialAiSource; url: string; title: string; publishedAt: string; text: string };
type OllamaDraft = { title_tr: string; title_en: string; content_tr: string; content_en: string };

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
  return [...links].slice(0, 5);
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

function validDraft(draft: OllamaDraft) {
  return draft.title_tr.trim().length >= 8 && draft.title_en.trim().length >= 8
    && draft.content_tr.trim().length >= 250 && draft.content_tr.trim().length <= 400
    && draft.content_en.trim().length >= 250 && draft.content_en.trim().length <= 400
    && sentenceCount(draft.content_tr, "tr") === 3 && sentenceCount(draft.content_en, "en") === 3;
}

const draftSchema = {
  type: "object",
  properties: {
    title_tr: { type: "string" }, title_en: { type: "string" },
    content_tr: { type: "string" }, content_en: { type: "string" },
  },
  required: ["title_tr", "title_en", "content_tr", "content_en"],
  additionalProperties: false,
};

async function createDraft(article: DiscoveredArticle): Promise<OllamaDraft | null> {
  const prompt = `Aşağıdaki resmî kaynak metninden diji.news için Türkçe ve İngilizce kısa haber yaz.
Kurallar: Her dildeki haber boşluklar dahil 250-400 karakter ve tam 3 cümle olmalı. Başlık kısa olmalı. Yalnızca kaynakta açıkça bulunan olguları kullan; yorum, övgü, tahmin, alıntı ve kaynak bağlantısı ekleme. Şirket adlarını değiştirme.
Kaynak: ${article.source.name}\nBaşlık: ${article.title}\nYayın tarihi: ${article.publishedAt}\nMetin: ${article.text}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: false, think: false, format: draftSchema, options: { temperature: 0.2, num_ctx: 16_384 }, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Ollama ${response.status} yanıtı verdi.`);
    const payload = await response.json() as { message?: { content?: string } };
    try {
      const draft = JSON.parse(payload.message?.content ?? "") as OllamaDraft;
      if (validDraft(draft)) return draft;
    } catch { /* Retry once when the local model ignores its JSON contract. */ }
  }
  return null;
}

export async function ollamaStatus() {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2_000), cache: "no-store" });
    if (!response.ok) return { online: false, modelReady: false };
    const payload = await response.json() as { models?: { name: string }[] };
    return { online: true, modelReady: Boolean(payload.models?.some((item) => item.name === model || item.name.startsWith(`${model}:`))) };
  } catch {
    return { online: false, modelReady: false };
  }
}

async function translateHeadlines(titles: string[]) {
  if (!titles.length) return [];
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model, stream: false, think: false, options: { temperature: 0.1, num_ctx: 8_192 },
      format: { type: "object", properties: { translations: { type: "array", items: { type: "string" }, minItems: titles.length, maxItems: titles.length } }, required: ["translations"], additionalProperties: false },
      messages: [{ role: "user", content: `Aşağıdaki teknoloji haber başlıklarını doğal ve kısa Türkçe başlıklara çevir. Özel isimleri ve ürün adlarını koru. Açıklama ekleme ve sıralamayı değiştirme.\n${JSON.stringify(titles)}` }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status} yanıtı verdi.`);
  const payload = await response.json() as { message?: { content?: string } };
  const parsed = JSON.parse(payload.message?.content ?? "") as { translations?: unknown[] };
  if (!Array.isArray(parsed.translations) || parsed.translations.length !== titles.length || parsed.translations.some((title) => typeof title !== "string" || title.trim().length < 5)) {
    throw new Error("Model başlık çevirilerini geçerli biçimde döndürmedi.");
  }
  return parsed.translations.map((title) => String(title).trim());
}

export async function scanOfficialAiNews(existingUrls: ReadonlySet<string>) {
  const discovered = await Promise.allSettled(officialAiSources.map(discoverFromSource));
  const articles = discovered.flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .filter((article) => !existingUrls.has(article.url) && !hasAiCandidateUrl(article.url) && !hasAiDiscoveryUrl(article.url))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 30);
  const untranslated = listUntranslatedAiDiscoveries();
  const translations = await translateHeadlines([...untranslated.map((item) => item.title), ...articles.map((article) => article.title)]);
  untranslated.forEach((item, index) => setAiDiscoveryTitleTr(item.id, translations[index]));
  for (const [index, article] of articles.entries()) {
    insertAiDiscovery({
      id: randomUUID(), sourceName: article.source.name, sourceUrl: article.url, sourcePublishedAt: article.publishedAt,
      title: article.title, titleTr: translations[untranslated.length + index], articleText: article.text, createdAt: new Date().toISOString(),
    });
  }
  return { sourcesChecked: discovered.length, created: articles.length };
}

export async function generateAiCandidate(discoveryId: string) {
  const discovery = getAiDiscovery(discoveryId);
  if (!discovery) throw new Error("Haber başlığı bulunamadı.");
  const source = sourceForUrl(discovery.sourceUrl);
  if (!source) throw new Error("Kaynak artık izin listesinde değil.");
  const draft = await createDraft({
    source, url: discovery.sourceUrl, title: discovery.title,
    publishedAt: discovery.sourcePublishedAt, text: discovery.articleText,
  });
  if (!draft) throw new Error("Model 3 cümle ve 250–400 karakter kurallarını karşılayan bir taslak üretemedi.");
  insertAiCandidate({
    id: randomUUID(), sourceName: discovery.sourceName, sourceUrl: discovery.sourceUrl,
    sourcePublishedAt: discovery.sourcePublishedAt, titleTr: draft.title_tr.trim(), titleEn: draft.title_en.trim(),
    contentTr: draft.content_tr.trim(), contentEn: draft.content_en.trim(), status: "pending", createdAt: new Date().toISOString(),
  });
  removeAiDiscovery(discoveryId);
}
