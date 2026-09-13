import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";

export type Recording = { id: string; day: string; language: "tr" | "en"; createdAt: string; bytes: number; engine: string; voice: string; script: string; durationSeconds: number; format: "wav" | "mp3" };
type Row = { id: string; day: string; language: "tr" | "en"; file: string; script: string; engine: string; voice: string; bytes: number; duration_seconds: number; created_at: string };
const validDay = /^\d{4}-\d{2}-\d{2}$/;

export function migrateRecordings(database: DatabaseSync) {
  database.exec(`create table if not exists speech_recordings (
    id text primary key, day text not null, file text not null,
    script text not null default '', engine text not null default '',
    bytes integer not null default 0, created_at text not null
  );`);
  const columns = new Set((database.prepare("pragma table_info(speech_recordings)").all() as { name: string }[]).map(column => column.name));
  for (const [name, definition] of Object.entries({ language: "text not null default 'tr'", voice: "text not null default ''", duration_seconds: "integer not null default 0" })) {
    if (!columns.has(name)) database.exec(`alter table speech_recordings add column ${name} ${definition}`);
  }
  database.exec(`create index if not exists speech_recordings_day_language_idx on speech_recordings(language, day, created_at desc);
    create table if not exists speech_generation_locks (id text primary key, token text not null, expires_at integer not null);`);
}

function toRecording(row: Row): Recording {
  return { id: row.id, day: row.day, language: row.language, createdAt: row.created_at, bytes: row.bytes, engine: row.engine, voice: row.voice, script: row.script, durationSeconds: row.duration_seconds, format: row.file.endsWith('.mp3') ? 'mp3' : 'wav' };
}

/** Draft metadata and audio never leave the editor's disk. */
export class LocalRecordings {
  private database: DatabaseSync;
  private directory: string;
  constructor(database: DatabaseSync, directory: string) {
    this.database = database;
    this.directory = directory;
    migrateRecordings(database);
  }
  list(day: string, language: "tr" | "en") {
    if (!validDay.test(day)) return [];
    const rows = this.database.prepare("select * from speech_recordings where day = ? and language = ? order by created_at desc").all(day, language) as unknown as Row[];
    return rows.map(toRecording);
  }
  days(language: "tr" | "en") {
    return (this.database.prepare("select distinct day from speech_recordings where language = ? order by day desc").all(language) as { day: string }[]).map(row => row.day);
  }
  get(id: string) {
    const row = this.database.prepare("select * from speech_recordings where id = ?").get(id) as Row | undefined;
    return row ? { ...toRecording(row), file: row.file } : null;
  }
  async read(id: string) {
    const row = this.get(id);
    if (!row) return null;
    try { return { ...row, audio: await readFile(row.file) }; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  }
  async save(input: Omit<Recording, "id" | "createdAt" | "bytes" | "format">, audio: Buffer) {
    if (!validDay.test(input.day) || !["tr", "en"].includes(input.language)) throw new Error("Geçersiz gün veya dil.");
    await mkdir(this.directory, { recursive: true });
    const id = randomUUID();
    const file = join(this.directory, `${input.day}-${input.language}-${id}.wav`);
    const createdAt = new Date().toISOString();
    await writeFile(file, audio, { flag: "wx", mode: 0o600 });
    try {
      this.database.prepare("insert into speech_recordings (id, day, language, file, script, engine, voice, bytes, duration_seconds, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, input.day, input.language, file, input.script, input.engine, input.voice, audio.length, input.durationSeconds, createdAt);
    } catch (error) { await rm(file, { force: true }); throw error; }
    return { ...input, id, createdAt, bytes: audio.length, format: "wav" as const };
  }
  async delete(id: string) {
    const row = this.get(id);
    if (!row) return false;
    await rm(row.file, { force: true });
    this.database.prepare("delete from speech_recordings where id = ?").run(id);
    return true;
  }
  async withLock<T>(work: () => Promise<T>): Promise<T> {
    const token = randomUUID();
    const now = Date.now();
    // Atomic lease also works across development workers and hot reloads.
    const lease = this.database.prepare(`insert into speech_generation_locks (id, token, expires_at) values ('daily-summary', ?, ?)
      on conflict(id) do update set token = excluded.token, expires_at = excluded.expires_at where speech_generation_locks.expires_at < ?`).run(token, now + 300_000, now);
    if (!lease.changes) throw new Error("Bir ses işlemi sürüyor. Tamamlanmasını bekleyin.");
    try { return await work(); }
    finally { this.database.prepare("delete from speech_generation_locks where id = 'daily-summary' and token = ?").run(token); }
  }
}
