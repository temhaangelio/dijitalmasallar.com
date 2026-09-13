import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { LocalRecordings } from "../src/lib/speech/local-recordings.ts";
import { audioResponse } from "../src/lib/speech/audio-response.ts";
import { generateGeminiSpeech } from "../src/lib/speech/gemini.ts";

const input = { day: "2026-09-13", language: "tr" as const, engine: "gemini-3.1-flash-tts-preview", voice: "Charon", script: "Dijital Masallar günlük teknoloji özetine hoş geldiniz.", durationSeconds: 1 };

test("Gemini output persists locally across connections, filters by language and deletes only the chosen take", async () => {
  const dir = await mkdtemp(join(tmpdir(), "local-speech-"));
  let db = new DatabaseSync(join(dir, "speech.db"));
  try {
    let store = new LocalRecordings(db, join(dir, "audio"));
    const pcm = Buffer.alloc(48000, 1);
    const fake: typeof fetch = async () => new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ inlineData: { mimeType: "audio/L16;rate=24000", data: pcm.toString("base64") } }] } }] }));
    const generated = await generateGeminiSpeech(input.script, "Charon", "tr", "test-key", fake);
    const take = await store.withLock(() => store.save(input, generated.wav));
    const english = await store.save({ ...input, language: "en" }, generated.wav);
    db.close();
    db = new DatabaseSync(join(dir, "speech.db"));
    store = new LocalRecordings(db, join(dir, "audio"));
    assert.deepEqual(store.list(input.day, "tr").map(row => row.id), [take.id]);
    assert.deepEqual(store.days("en"), [input.day]);
    assert.deepEqual((await store.read(take.id))?.audio, generated.wav);
    assert.equal(store.get("../../outside.wav"), null);
    assert.equal(store.get("' OR 1=1 --"), null);
    assert.equal(await store.delete(take.id), true);
    assert.equal(await store.read(take.id), null);
    assert.ok(await store.read(english.id));
    assert.equal((await readdir(join(dir, "audio"))).length, 1);
  } finally { db.close(); await rm(dir, { recursive: true, force: true }); }
});

test("old SQLite index and MP3 metadata survive additive migration", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("create table speech_recordings (id text primary key, day text not null, file text not null, script text not null default '', engine text not null default '', bytes integer not null default 0, created_at text not null)");
    db.prepare("insert into speech_recordings values (?, ?, ?, ?, ?, ?, ?)").run("old-take", input.day, "/tmp/old-take.mp3", "Old text", "piper", 50, "2026-09-12");
    const store = new LocalRecordings(db, "/tmp/unused");
    assert.equal(store.list(input.day, "tr")[0].format, "mp3");
    assert.equal(store.get("old-take")?.script, "Old text");
    assert.equal(store.list(input.day, "en").length, 0);
    assert.doesNotThrow(() => new LocalRecordings(db, "/tmp/unused"));
  } finally { db.close(); }
});

test("local lease rejects overlapping generation and releases after failures", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    const first = new LocalRecordings(db, "/tmp/unused");
    const second = new LocalRecordings(db, "/tmp/unused");
    await first.withLock(async () => {
      await assert.rejects(second.withLock(async () => {}), /Bir ses işlemi sürüyor/);
    });
    await assert.rejects(first.withLock(async () => { throw new Error("generation failed"); }), /generation failed/);
    assert.equal(await second.withLock(async () => "ready"), "ready");
    db.prepare("insert into speech_generation_locks values ('daily-summary', 'expired', 0)").run();
    assert.equal(await first.withLock(async () => "recovered"), "recovered");
  } finally { db.close(); }
});

test("local playback supports full downloads, seeking, suffix ranges and invalid ranges", async () => {
  const take = { audio: Buffer.from("0123456789"), day: input.day, language: "tr" as const, format: "wav" as const };
  const request = (range?: string) => new Request("http://localhost/gunun-ozeti/ses/id?download=1", { headers: range ? { range } : {} });
  const full = audioResponse(request(), take);
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("cache-control"), "private, no-store");
  assert.match(full.headers.get("content-disposition")!, /^attachment/);
  assert.match(full.headers.get("content-disposition")!, /2026-09-13-tr\.wav/);
  assert.match(audioResponse(request(), { ...take, language: "en" }).headers.get("content-disposition")!, /2026-09-13-en\.wav/);
  assert.equal(await full.text(), "0123456789");
  const partial = audioResponse(request("bytes=2-5"), take);
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await partial.text(), "2345");
  assert.equal(await audioResponse(request("bytes=-3"), take).text(), "789");
  assert.equal(await audioResponse(request("bytes=8-"), take).text(), "89");
  for (const range of ["bytes=10-", "bytes=5-2", "bytes=-0", "bytes=", "bytes=0-1,3-4"]) assert.equal(audioResponse(request(range), take).status, 416);
});
