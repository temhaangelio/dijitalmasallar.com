import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * The speech tool keeps its index in a local SQLite file, the same way the RSS reader keeps its
 * feeds: recordings are a working artefact for the editor, not site content, and nothing about them
 * ever reaches a visitor page or Supabase.
 *
 * Only the index lives here. The mp3 itself stays a file on disk, because the whole point of it is
 * to be dragged into a video editor — a blob inside a database would have to be exported again
 * before it could be used. The row says which day it belongs to, which voice made it, what was
 * read, and where the file is.
 *
 * `node:sqlite` is Node's built-in driver, so this costs no dependency. The file lives beside the
 * RSS database in the git-ignored `data/` folder; `SPEECH_DB_PATH` moves it.
 */
const databaseFile = process.env.SPEECH_DB_PATH?.trim() || path.join(process.cwd(), "data", "speech.db");

const schema = `
create table if not exists speech_recordings (
  id text primary key,
  day text not null,
  file text not null,
  script text not null default '',
  engine text not null default '',
  bytes integer not null default 0,
  created_at text not null
);

create index if not exists speech_recordings_day_idx on speech_recordings(day, created_at desc);
`;

/**
 * A module-level variable is not enough: Next's dev server re-evaluates modules on every edit,
 * which would leave a growing pile of open handles on the same file. The connection is parked on
 * `globalThis` so hot reloads reuse it.
 */
const connectionKey = Symbol.for("dijitalmasallar.com/speech-database");
type ConnectionHolder = { [connectionKey]?: DatabaseSync };

/** Module state resets on a hot reload while the connection does not, so a mismatch means re-migrate. */
let migratedConnection: DatabaseSync | null = null;

export function speechDatabase(): DatabaseSync {
  const holder = globalThis as ConnectionHolder;
  let database = holder[connectionKey];

  if (!database) {
    mkdirSync(path.dirname(databaseFile), { recursive: true });
    database = new DatabaseSync(databaseFile);
    database.exec("pragma journal_mode = wal");
    holder[connectionKey] = database;
  }

  if (migratedConnection !== database) {
    database.exec(schema);
    migratedConnection = database;
  }

  return database;
}
