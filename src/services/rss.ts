import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { rssDatabase } from "@/lib/rss/local-db";
import { discoverFeedUrls, parseFeed } from "@/lib/rss/parse";
import { scrapePage } from "@/lib/rss/scrape";
import { assertFetchableUrl, download as downloadRemote } from "@/lib/net/remote";

/** A `page` source is a listing with no feed of its own, read by scraping its links. */
export type RssFeedKind = "feed" | "page";

export type RssFeed = {
  id: string;
  url: string;
  kind: RssFeedKind;
  title: string;
  siteUrl: string;
  active: boolean;
  lastFetchedAt: string | null;
  lastError: string | null;
  itemCount: number;
  unreadCount: number;
  createdAt: string;
};

export type RssItem = {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  link: string;
  summary: string;
  author: string;
  publishedAt: string | null;
  fetchedAt: string;
  read: boolean;
};

export type RefreshSummary = { checked: number; added: number; failed: number };

const requestTimeoutMs = 15_000;
const maxFeedBytes = 5 * 1024 * 1024;
const itemListLimit = 200;

/**
 * Tried, in order, when a page neither is a feed nor advertises one. Between them these cover
 * WordPress, Ghost, Hugo, Jekyll, Substack and Blogger, which is most of what a blog runs on.
 */
const commonFeedPaths = ["/feed", "/rss.xml", "/rss", "/feed.xml", "/atom.xml", "/index.xml", "/feeds/posts/default?alt=rss"];
const discoveryTimeoutMs = 8_000;

/** The one failure that has a second option behind it: the page may still be scrapeable. */
export const noFeedFoundMessage = "Bu adreste bir RSS veya Atom akışı bulunamadı.";

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function count(value: unknown) { return typeof value === "number" ? value : Number(value ?? 0) || 0; }

/**
 * The RSS reader follows addresses someone typed in, so the guard rail, size cap and timeout live
 * in `@/lib/net/remote`. This wrapper keeps the
 * reader's own call sites unchanged: they want the body or an error, never a 304, because they
 * never send a conditional request.
 */
async function download(url: string, timeoutMs = requestTimeoutMs) {
  const result = await downloadRemote(url, { timeoutMs, maxBytes: maxFeedBytes });
  if (!result) throw new Error("Kaynak yanıt vermedi.");
  return result.body;
}

/**
 * Turns whatever address was pasted into an address that actually parses as a feed.
 *
 * Someone following a blog usually has its homepage, not its feed — so if the URL is not itself a
 * feed, the page is read for a `<link rel="alternate">` announcement, and failing that the handful
 * of conventional paths are probed. Each candidate is proven by parsing it, never by its extension
 * or content type, both of which sites get wrong routinely.
 */
async function resolveFeedUrl(url: string) {
  const body = await download(url);
  if (parseFeed(body, url).items.length) return { url, body };

  const seen = new Set([url]);
  const candidates = [...discoverFeedUrls(body, url), ...commonFeedPaths.map((path) => new URL(path, url).toString())];

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const target = assertFetchableUrl(candidate);
      const candidateBody = await download(target, discoveryTimeoutMs);
      if (parseFeed(candidateBody, target).items.length) return { url: target, body: candidateBody };
    } catch { /* A candidate that does not answer is simply not the feed. */ }
  }

  throw new Error(noFeedFoundMessage);
}

function itemId(feedId: string, guid: string) {
  return createHash("sha1").update(`${feedId} ${guid}`).digest("hex");
}

/**
 * Re-inserting an item that is already stored refreshes what the publisher may have edited, and
 * deliberately leaves `read` and `fetched_at` alone so a corrected headline does not push an
 * already-seen entry back into the unread list.
 */
const upsertItem = `
insert into rss_items (id, feed_id, guid, title, link, summary, author, published_at, fetched_at, read)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
on conflict (feed_id, guid) do update set
  title = excluded.title,
  link = excluded.link,
  summary = excluded.summary,
  author = excluded.author,
  published_at = coalesce(excluded.published_at, rss_items.published_at)
`;

function readContent(kind: RssFeedKind, body: string, url: string) {
  return kind === "page" ? scrapePage(body, url) : parseFeed(body, url);
}

function storeFeedContent(feedId: string, url: string, body: string, kind: RssFeedKind = "feed") {
  const database = rssDatabase();
  const parsed = readContent(kind, body, url);
  const now = new Date().toISOString();
  const insert = database.prepare(upsertItem);
  const total = () => count(database.prepare("select count(*) as total from rss_items where feed_id = ?").get(feedId)?.total);
  const before = total();

  database.exec("begin");
  try {
    for (const item of parsed.items) {
      insert.run(itemId(feedId, item.guid), feedId, item.guid, item.title, item.link, item.summary, item.author, item.publishedAt, now);
    }
    database.exec("commit");
  } catch (error) {
    database.exec("rollback");
    throw error;
  }

  return { parsed, added: total() - before, fetchedAt: now };
}

export function listFeeds(): RssFeed[] {
  const rows = rssDatabase().prepare(`
    select f.id, f.url, f.kind, f.title, f.site_url, f.active, f.last_fetched_at, f.last_error, f.created_at,
           (select count(*) from rss_items i where i.feed_id = f.id) as item_count,
           (select count(*) from rss_items i where i.feed_id = f.id and i.read = 0) as unread_count
    from rss_feeds f
    order by f.created_at asc
  `).all();

  return rows.map((row) => ({
    id: text(row.id),
    url: text(row.url),
    kind: text(row.kind) === "page" ? "page" : "feed",
    title: text(row.title),
    siteUrl: text(row.site_url),
    active: count(row.active) === 1,
    lastFetchedAt: row.last_fetched_at ? text(row.last_fetched_at) : null,
    lastError: row.last_error ? text(row.last_error) : null,
    itemCount: count(row.item_count),
    unreadCount: count(row.unread_count),
    createdAt: text(row.created_at),
  }));
}

export function listItems({ feedId, unreadOnly = false, limit = itemListLimit }: { feedId?: string; unreadOnly?: boolean; limit?: number } = {}): RssItem[] {
  const conditions: string[] = [];
  const parameters: string[] = [];
  if (feedId) { conditions.push("i.feed_id = ?"); parameters.push(feedId); }
  if (unreadOnly) conditions.push("i.read = 0");
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const rows = rssDatabase().prepare(`
    select i.id, i.feed_id, i.title, i.link, i.summary, i.author, i.published_at, i.fetched_at, i.read,
           coalesce(nullif(f.title, ''), f.url) as feed_title
    from rss_items i
    join rss_feeds f on f.id = i.feed_id
    ${where}
    order by coalesce(i.published_at, i.fetched_at) desc, i.fetched_at desc, i.rowid desc
    limit ?
  `).all(...parameters, Math.min(Math.max(limit, 1), 500));

  return rows.map((row) => ({
    id: text(row.id),
    feedId: text(row.feed_id),
    feedTitle: text(row.feed_title),
    title: text(row.title),
    link: text(row.link),
    summary: text(row.summary),
    author: text(row.author),
    publishedAt: row.published_at ? text(row.published_at) : null,
    fetchedAt: text(row.fetched_at),
    read: count(row.read) === 1,
  }));
}

/**
 * Adds the feed and pulls it once immediately, so the list is never empty right after saving. The
 * address is resolved first, which is also why the duplicate check runs twice: two different pages
 * on one site resolve to the same feed.
 */
export async function addFeed(rawUrl: string) {
  const requested = assertFetchableUrl(rawUrl.trim());
  const database = rssDatabase();
  const isKnown = (value: string) => Boolean(database.prepare("select id from rss_feeds where url = ?").get(value));
  if (isKnown(requested)) throw new Error("Bu kaynak zaten ekli.");

  const { url, body } = await resolveFeedUrl(requested);
  if (url !== requested && isKnown(url)) throw new Error("Bu kaynak zaten ekli.");

  const id = randomUUID();
  const hostname = new URL(url).hostname;
  database.prepare("insert into rss_feeds (id, url, kind, title, site_url, active, created_at) values (?, ?, 'feed', '', '', 1, ?)").run(id, url, new Date().toISOString());

  try {
    const { parsed, fetchedAt, added } = storeFeedContent(id, url, body);
    if (!parsed.items.length) throw new Error("Bu adreste okunabilir bir RSS veya Atom akışı bulunamadı.");
    database.prepare("update rss_feeds set title = ?, site_url = ?, last_fetched_at = ?, last_error = null where id = ?")
      .run(parsed.title || hostname, parsed.siteUrl, fetchedAt, id);
    return { title: parsed.title || hostname, added };
  } catch (error) {
    // A feed that could not be read is not worth keeping as a broken row the admin has to clean up.
    database.prepare("delete from rss_feeds where id = ?").run(id);
    throw error;
  }
}

/**
 * Follows a page that publishes no feed by reading its own links — see `scrapePage`. Offered only
 * after `addFeed` has failed to find a feed, because a real feed is better in every way: it carries
 * dates, summaries and stable ids, and it does not break when the site is redesigned.
 */
export async function addPageSource(rawUrl: string) {
  const url = assertFetchableUrl(rawUrl.trim());
  const database = rssDatabase();
  if (database.prepare("select id from rss_feeds where url = ?").get(url)) throw new Error("Bu kaynak zaten ekli.");

  const body = await download(url);
  const scraped = scrapePage(body, url);
  if (!scraped.items.length) {
    throw new Error("Bu sayfada takip edilebilecek bir başlık listesi bulunamadı. Sayfa içeriğini tarayıcıda oluşturuyorsa bu yöntem çalışmaz.");
  }

  const id = randomUUID();
  const hostname = new URL(url).hostname;
  database.prepare("insert into rss_feeds (id, url, kind, title, site_url, active, created_at) values (?, ?, 'page', '', '', 1, ?)").run(id, url, new Date().toISOString());

  try {
    const { fetchedAt, added } = storeFeedContent(id, url, body, "page");
    database.prepare("update rss_feeds set title = ?, site_url = ?, last_fetched_at = ?, last_error = null where id = ?")
      .run(scraped.title || hostname, url, fetchedAt, id);
    return { title: scraped.title || hostname, added };
  } catch (error) {
    database.prepare("delete from rss_feeds where id = ?").run(id);
    throw error;
  }
}

export function removeFeed(id: string) {
  // The items go with it through `on delete cascade`; foreign keys are enabled on the connection.
  rssDatabase().prepare("delete from rss_feeds where id = ?").run(id);
}

/**
 * Renames a source and marks the name as the person's own, which is what stops the next refresh
 * from putting the publisher's title back — see the `title_custom` guard in `refreshFeeds`.
 */
export function renameFeed(id: string, title: string) {
  const name = title.trim();
  if (name.length < 2 || name.length > 80) throw new Error("Kaynak adı 2–80 karakter olmalı.");
  rssDatabase().prepare("update rss_feeds set title = ?, title_custom = 1 where id = ?").run(name, id);
  return name;
}

export function setFeedActive(id: string, active: boolean) {
  rssDatabase().prepare("update rss_feeds set active = ? where id = ?").run(active ? 1 : 0, id);
}

export function markItemRead(id: string, read: boolean) {
  rssDatabase().prepare("update rss_items set read = ? where id = ?").run(read ? 1 : 0, id);
}

export function markAllRead(feedId?: string) {
  if (feedId) rssDatabase().prepare("update rss_items set read = 1 where read = 0 and feed_id = ?").run(feedId);
  else rssDatabase().prepare("update rss_items set read = 1 where read = 0").run();
}

/** Permanently removes read entries while leaving their feeds and unread entries untouched. */
export function removeReadItems(feedId?: string) {
  const result = feedId
    ? rssDatabase().prepare("delete from rss_items where read = 1 and feed_id = ?").run(feedId)
    : rssDatabase().prepare("delete from rss_items where read = 1").run();
  return Number(result.changes);
}

/**
 * Pulls every active feed. One unreachable source records its error on its own row and leaves the
 * rest of the refresh untouched, which is why failures are collected rather than thrown.
 */
export async function refreshFeeds(feedId?: string): Promise<RefreshSummary> {
  const database = rssDatabase();
  const rows = feedId
    ? database.prepare("select id, url, kind from rss_feeds where id = ? and active = 1").all(feedId)
    : database.prepare("select id, url, kind from rss_feeds where active = 1 order by created_at asc").all();

  const results = await Promise.all(rows.map(async (row) => {
    const id = text(row.id);
    const url = text(row.url);
    const kind: RssFeedKind = text(row.kind) === "page" ? "page" : "feed";
    try {
      const body = await download(url);
      const { parsed, fetchedAt, added } = storeFeedContent(id, url, body, kind);
      database.prepare(`
        update rss_feeds set
          title = case when title_custom = 1 or ? = '' then title else ? end,
          site_url = case when ? <> '' then ? else site_url end,
          last_fetched_at = ?, last_error = null
        where id = ?
      `).run(parsed.title, parsed.title, parsed.siteUrl, parsed.siteUrl, fetchedAt, id);
      return { added, failed: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kaynak çekilemedi.";
      database.prepare("update rss_feeds set last_fetched_at = ?, last_error = ? where id = ?").run(new Date().toISOString(), message.slice(0, 200), id);
      return { added: 0, failed: true };
    }
  }));

  return {
    checked: results.length,
    added: results.reduce((total, result) => total + result.added, 0),
    failed: results.filter((result) => result.failed).length,
  };
}
