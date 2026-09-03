import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * The RSS module keeps its data in a local SQLite file rather than in Supabase, on purpose: the
 * followed feeds and their items are a working tool for the editor, not site content, and nothing
 * about them ever reaches a visitor page.
 *
 * `node:sqlite` is Node's built-in driver, so this costs no dependency. It is still flagged
 * experimental, which is why Node prints one `ExperimentalWarning` on the first query.
 *
 * The file lives outside the repo tree by default (`data/rss.db`, git-ignored). Set `RSS_DB_PATH`
 * to move it — useful when the app runs somewhere with a different writable directory.
 */
const databaseFile = process.env.RSS_DB_PATH?.trim() || path.join(process.cwd(), "data", "rss.db");

const schema = `
create table if not exists rss_feeds (
  id text primary key,
  url text not null unique,
  title text not null default '',
  site_url text not null default '',
  active integer not null default 1,
  kind text not null default 'feed',
  title_custom integer not null default 0,
  last_fetched_at text,
  last_error text,
  created_at text not null
);

create table if not exists rss_items (
  id text primary key,
  feed_id text not null references rss_feeds(id) on delete cascade,
  guid text not null,
  title text not null default '',
  link text not null default '',
  summary text not null default '',
  author text not null default '',
  published_at text,
  fetched_at text not null,
  read integer not null default 0,
  unique (feed_id, guid)
);

create index if not exists rss_items_recent_idx on rss_items(published_at desc, fetched_at desc);
create index if not exists rss_items_feed_idx on rss_items(feed_id, published_at desc);
create index if not exists rss_items_unread_idx on rss_items(read, published_at desc);
`;

/**
 * A module-level variable is not enough: Next's dev server re-evaluates modules on every edit,
 * which would leave a growing pile of open handles on the same file. The connection is parked on
 * `globalThis` so hot reloads reuse it.
 */
const connectionKey = Symbol.for("dijitalmasallar.com/rss-database");
type ConnectionHolder = { [connectionKey]?: DatabaseSync };

/**
 * Tracks which connection this evaluation of the module has already migrated.
 *
 * Deliberately module-level rather than on `globalThis`: the connection survives a hot reload, so
 * running the migrations only when one is *opened* means a migration added while the dev server was
 * running would never reach the open connection — which is exactly how `kind` came to be missing at
 * runtime while every fresh-database test passed. Module state resets on reload, the connection does
 * not, so the mismatch is the signal to check again.
 */
let migratedConnection: DatabaseSync | null = null;

export function rssDatabase(): DatabaseSync {
  const holder = globalThis as ConnectionHolder;
  let database = holder[connectionKey];

  if (!database) {
    mkdirSync(path.dirname(databaseFile), { recursive: true });
    database = new DatabaseSync(databaseFile);
    // WAL keeps a long refresh from blocking the page that is reading the item list.
    database.exec("pragma journal_mode = wal");
    database.exec("pragma foreign_keys = on");
    database.exec(schema);
    holder[connectionKey] = database;
  }

  if (migratedConnection !== database) {
    migrate(database);
    migratedConnection = database;
  }

  return database;
}

/**
 * `create table if not exists` leaves an existing file alone, so a column added after someone has
 * already followed a few sources would never appear for them. Each step here is checked against the
 * live table rather than a stored version number, which keeps it honest whatever state the file is
 * in.
 */
function migrate(database: DatabaseSync) {
  const columns = database.prepare("pragma table_info(rss_feeds)").all().map((row) => String(row.name));
  // `kind` tells a real feed from a page whose headings are scraped, added when page sources landed.
  if (!columns.includes("kind")) database.exec("alter table rss_feeds add column kind text not null default 'feed'");
  // `title_custom` marks a name the person typed, so a refresh does not overwrite it with the
  // publisher's own.
  if (!columns.includes("title_custom")) database.exec("alter table rss_feeds add column title_custom integer not null default 0");
}

export { databaseFile as rssDatabaseFile };
