import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AiCandidateStatus, AiNewsCandidate, AiNewsDiscovery } from "./types";

const databaseFile = process.env.AI_NEWS_DB_PATH?.trim() || path.join(process.cwd(), "data", "ai-news.db");
const connectionKey = Symbol.for("dijitalmasallar.com/ai-news-database");
type ConnectionHolder = { [connectionKey]?: DatabaseSync };
// Next.js keeps the global connection alive across development hot reloads, while module state is
// recreated. This marker makes every new module evaluation re-apply idempotent schema additions to
// that existing connection, so newly added tables are available without restarting the dev server.
let migratedConnection: DatabaseSync | null = null;

const schema = `
create table if not exists ai_news_settings (
  id integer primary key check (id = 1),
  instructions text not null,
  updated_at text not null
);

create table if not exists ai_news_ignored_urls (
  source_url text primary key,
  ignored_at text not null
);

create table if not exists ai_news_candidates (
  id text primary key,
  source_name text not null,
  source_url text not null unique,
  source_published_at text,
  title_tr text not null,
  title_en text not null,
  content_tr text not null,
  content_en text not null,
  status text not null default 'pending' check (status in ('pending', 'rejected', 'published')),
  created_at text not null
);
create index if not exists ai_news_candidates_status_idx on ai_news_candidates(status, created_at desc);

create table if not exists ai_news_discoveries (
  id text primary key,
  source_name text not null,
  source_url text not null unique,
  source_published_at text not null,
  title text not null,
  title_tr text not null default '',
  article_text text not null,
  created_at text not null
);
create index if not exists ai_news_discoveries_date_idx on ai_news_discoveries(source_published_at desc);
`;

export const defaultAiAgentInstructions = "Yalnızca teknoloji, yapay zekâ, bilim ve dijital kültürde geniş bir okur kitlesi için önemli, yeni ve somut gelişmeleri öne çıkar. Kurumsal reklamları, etkinlik duyurularını, küçük ürün güncellemelerini ve yinelenen haberleri ele. Resmî kaynaktaki olguların dışına çıkma; sakin, açık ve tarafsız bir yayın dili kullan.";

function database() {
  const holder = globalThis as ConnectionHolder;
  let connection = holder[connectionKey];
  if (!connection) {
    mkdirSync(path.dirname(databaseFile), { recursive: true });
    connection = new DatabaseSync(databaseFile);
    connection.exec("pragma journal_mode = wal");
    holder[connectionKey] = connection;
  }
  if (migratedConnection !== connection) {
    connection.exec(schema);
    const discoveryColumns = connection.prepare("pragma table_info(ai_news_discoveries)").all().map((row) => String(row.name));
    if (!discoveryColumns.includes("title_tr")) connection.exec("alter table ai_news_discoveries add column title_tr text not null default ''");
    migratedConnection = connection;
  }
  return connection;
}

function mapCandidate(row: Record<string, unknown>): AiNewsCandidate {
  return {
    id: String(row.id),
    sourceName: String(row.source_name),
    sourceUrl: String(row.source_url),
    sourcePublishedAt: row.source_published_at ? String(row.source_published_at) : null,
    titleTr: String(row.title_tr),
    titleEn: String(row.title_en),
    contentTr: String(row.content_tr),
    contentEn: String(row.content_en),
    status: String(row.status) as AiCandidateStatus,
    createdAt: String(row.created_at),
  };
}

export function listAiCandidates(status: AiCandidateStatus = "pending") {
  return database().prepare("select * from ai_news_candidates where status = ? order by created_at desc").all(status).map(mapCandidate);
}

export function getAiCandidate(id: string) {
  const row = database().prepare("select * from ai_news_candidates where id = ?").get(id);
  return row ? mapCandidate(row) : null;
}

export function hasAiCandidateUrl(url: string) {
  return Boolean(database().prepare("select 1 from ai_news_candidates where source_url = ? limit 1").get(url));
}

function mapDiscovery(row: Record<string, unknown>): AiNewsDiscovery {
  return {
    id: String(row.id), sourceName: String(row.source_name), sourceUrl: String(row.source_url),
    sourcePublishedAt: String(row.source_published_at), title: String(row.title), titleTr: String(row.title_tr || row.title), createdAt: String(row.created_at),
  };
}

export function listAiDiscoveries() {
  return database().prepare("select id, source_name, source_url, source_published_at, title, title_tr, created_at from ai_news_discoveries order by source_published_at desc").all().map(mapDiscovery);
}

export function getAiDiscovery(id: string) {
  const row = database().prepare("select * from ai_news_discoveries where id = ?").get(id);
  if (!row) return null;
  return { ...mapDiscovery(row), articleText: String(row.article_text) };
}

export function hasAiDiscoveryUrl(url: string) {
  return Boolean(database().prepare("select 1 from ai_news_discoveries where source_url = ? limit 1").get(url));
}

export function hasIgnoredAiDiscoveryUrl(url: string) {
  return Boolean(database().prepare("select 1 from ai_news_ignored_urls where source_url = ? limit 1").get(url));
}

export function insertAiDiscovery(discovery: AiNewsDiscovery & { articleText: string }) {
  database().prepare(`insert or ignore into ai_news_discoveries
    (id, source_name, source_url, source_published_at, title, title_tr, article_text, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(discovery.id, discovery.sourceName, discovery.sourceUrl, discovery.sourcePublishedAt, discovery.title, discovery.titleTr, discovery.articleText, discovery.createdAt);
}

export function listUntranslatedAiDiscoveries() {
  return database().prepare("select id, title from ai_news_discoveries where title_tr = '' order by source_published_at desc limit 50").all()
    .map((row) => ({ id: String(row.id), title: String(row.title) }));
}

export function setAiDiscoveryTitleTr(id: string, titleTr: string) {
  database().prepare("update ai_news_discoveries set title_tr = ? where id = ?").run(titleTr, id);
}

export function removeAiDiscovery(id: string) {
  database().prepare("delete from ai_news_discoveries where id = ?").run(id);
}

export function dismissAiDiscovery(id: string) {
  const row = database().prepare("select source_url from ai_news_discoveries where id = ?").get(id);
  if (!row) return false;
  database().prepare("insert or replace into ai_news_ignored_urls (source_url, ignored_at) values (?, ?)")
    .run(String(row.source_url), new Date().toISOString());
  database().prepare("delete from ai_news_discoveries where id = ?").run(id);
  return true;
}

export function insertAiCandidate(candidate: AiNewsCandidate) {
  database().prepare(`insert or ignore into ai_news_candidates
    (id, source_name, source_url, source_published_at, title_tr, title_en, content_tr, content_en, status, created_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(candidate.id, candidate.sourceName, candidate.sourceUrl, candidate.sourcePublishedAt, candidate.titleTr, candidate.titleEn, candidate.contentTr, candidate.contentEn, candidate.status, candidate.createdAt);
}

export function setAiCandidateStatus(id: string, status: AiCandidateStatus) {
  database().prepare("update ai_news_candidates set status = ? where id = ?").run(status, id);
}

export function getAiAgentInstructions() {
  const row = database().prepare("select instructions from ai_news_settings where id = 1").get();
  return row ? String(row.instructions) : defaultAiAgentInstructions;
}

export function setAiAgentInstructions(instructions: string) {
  database().prepare(`insert into ai_news_settings (id, instructions, updated_at) values (1, ?, ?)
    on conflict(id) do update set instructions = excluded.instructions, updated_at = excluded.updated_at`)
    .run(instructions, new Date().toISOString());
}

export { databaseFile as aiNewsDatabaseFile };
