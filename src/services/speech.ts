import "server-only";

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { speechDatabase } from "@/lib/speech/local-db";

const run = promisify(execFile);

/**
 * Reading the day's summary aloud, entirely on this machine.
 *
 * Two different local tools do the two halves, because no single one does both:
 *
 *  - **Ollama** turns the summary into something a person would say — it drops the list-ness, adds
 *    a greeting and a sign-off, and spells out what does not read aloud. It serves language models
 *    and nothing else: its API has no speech endpoint and neither installed model reports an audio
 *    capability, so it cannot make the sound.
 *  - **Piper** makes the sound, with a neural Turkish voice that runs on the CPU in a couple of
 *    seconds, and `ffmpeg` packs it into an mp3 small enough to hand back through a server action.
 *    When Piper is not installed the system's own `say` voice stands in, so the button still works
 *    on a machine that has only macOS.
 *
 * Both live on the editor's own computer, so this is a local tool in the same sense the RSS reader
 * is: `isLocalToolAvailable()` keeps it out of the deployed site, where neither binary exists.
 */
const ollamaUrl = () => process.env.OLLAMA_URL?.trim() || "http://127.0.0.1:11434";
const ollamaModel = () => process.env.OLLAMA_MODEL?.trim() || "gemma3:12b";
const sayVoice = () => process.env.SPEECH_VOICE?.trim() || "Yelda";
/* Installed outside the repository — a voice is 60 MB and has no business in version control. */
const piperBin = () => process.env.PIPER_BIN?.trim() || join(homedir(), ".local/share/diji-piper/venv/bin/piper");
const piperVoice = () => process.env.PIPER_VOICE?.trim() || join(homedir(), ".local/share/diji-piper/voices/tr_TR-dfki-medium.onnx");

export type SpeechEngine = "piper" | "say";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

/** Piper when it is installed, the system voice when it is not. */
async function pickEngine(): Promise<{ engine: SpeechEngine; bin: string; model: string }> {
  const bin = piperBin();
  const model = piperVoice();
  if (await exists(bin) && await exists(model)) return { engine: "piper", bin, model };
  return { engine: "say", bin: "say", model: "" };
}

/**
 * Where a finished recording is kept.
 *
 * On disk rather than in the browser: the file is the point of the feature — it goes into a video,
 * it gets listened to again tomorrow — and a blob in a tab dies with the tab. The folder sits
 * beside the project and is git-ignored, so the files are one Finder window away without ever
 * reaching the repository or the deployed site. What was recorded, when, and by which voice is
 * indexed in the local SQLite database, the same way the RSS reader indexes its feeds.
 */
export function recordingsDir() {
  return process.env.SPEECH_DIR?.trim() || join(process.cwd(), "ses-kayitlari");
}

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export type Recording = { id: string; day: string; createdAt: string; bytes: number; engine: string; script: string };

type RecordingRow = { id: string; day: string; file: string; script: string; engine: string; bytes: number; created_at: string };

function toRecording(row: RecordingRow): Recording {
  return { id: row.id, day: row.day, createdAt: row.created_at, bytes: row.bytes, engine: row.engine, script: row.script };
}

/** Every take made for a day, newest first. Re-recording adds a take rather than replacing one. */
export function listRecordings(day: string): Recording[] {
  if (!dayPattern.test(day)) return [];
  try {
    const rows = speechDatabase().prepare("select * from speech_recordings where day = ? order by created_at desc").all(day) as unknown as RecordingRow[];
    return rows.map(toRecording);
  } catch {
    return [];
  }
}

/** Which days have at least one take, for the marks in the day list. */
export function listRecordingDays(): string[] {
  try {
    const rows = speechDatabase().prepare("select distinct day from speech_recordings").all() as unknown as { day: string }[];
    return rows.map((row) => row.day);
  } catch {
    return [];
  }
}

/** One take's row, for the actions that publish or delete it. */
export async function readRecordingRow(id: string) {
  try {
    const row = speechDatabase().prepare("select * from speech_recordings where id = ?").get(id) as unknown as RecordingRow | undefined;
    if (!row) return null;
    return { ...toRecording(row), file: row.file };
  } catch {
    return null;
  }
}

/** How long an mp3 runs, in whole seconds. Zero when ffprobe cannot say. */
export async function audioDuration(file: string) {
  try {
    const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
    const seconds = Number.parseFloat(stdout.trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : 0;
  } catch {
    return 0;
  }
}

/** The bytes themselves, for the route that plays them. The path comes from the row, never from the URL. */
export async function readRecordingFile(id: string) {
  try {
    const row = speechDatabase().prepare("select * from speech_recordings where id = ?").get(id) as unknown as RecordingRow | undefined;
    if (!row) return null;
    return { day: row.day, mp3: await readFile(row.file) };
  } catch {
    return null;
  }
}

/** Removes the row and the file it points at. */
export async function deleteRecording(id: string) {
  try {
    const database = speechDatabase();
    const row = database.prepare("select * from speech_recordings where id = ?").get(id) as unknown as RecordingRow | undefined;
    if (!row) return false;
    database.prepare("delete from speech_recordings where id = ?").run(id);
    await rm(row.file, { force: true });
    return true;
  } catch {
    return false;
  }
}

/** Long enough for a 12B model to write a minute of speech on a laptop; measured at ~40 s. */
const scriptTimeoutMs = 180_000;

export function isSpeechAvailable() {
  return isLocalToolAvailable();
}

const speakerBrief = [
  "Sen bir radyo haber spikerisin. Verilen günlük haber özetini, sesli okunmak üzere akıcı bir Türkçe metne dönüştür.",
  "Kurallar:",
  "- Madde işareti, numara, başlık ve emoji kullanma.",
  "- Kısa bir selamlama ile başla, kısa bir kapanışla bitir. Metin dinlenecek, izlenmeyecek; 'dinleyiciler' de.",
  "- Kısaltmaları okunduğu gibi yaz, sayıları yazıyla ver.",
  "- Bağlantı, adres ve etiket yazma.",
  "- Haberleri verilen sırayla anlat, yeni bilgi uydurma.",
  "- Sadece okunacak metni döndür; açıklama, başlık veya tırnak ekleme.",
].join("\n");

type ScriptResult = { success: true; script: string } | { success: false; message: string };

/** The spoken version of the text, written by the local model. */
export async function writeSpokenScript(text: string): Promise<ScriptResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), scriptTimeoutMs);
  try {
    const response = await fetch(`${ollamaUrl()}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: ollamaModel(),
        system: speakerBrief,
        prompt: text,
        stream: false,
        // `think: false` matters for the models that reason by default: the reasoning would be
        // spoken along with the news.
        think: false,
        options: { temperature: 0.4, num_predict: 900 },
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { success: false, message: detail.includes("not found") ? `Model bulunamadı: ${ollamaModel()}. \`ollama pull ${ollamaModel()}\` ile indirin.` : "Yerel model yanıt vermedi." };
    }
    const data = (await response.json()) as { response?: unknown };
    const script = typeof data.response === "string" ? data.response.trim() : "";
    return script ? { success: true, script } : { success: false, message: "Yerel model boş bir metin döndürdü." };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return { success: false, message: "Yerel model zaman aşımına uğradı." };
    return { success: false, message: "Ollama'ya ulaşılamadı. `ollama serve` çalışıyor mu?" };
  } finally {
    clearTimeout(timer);
  }
}

type SpeechResult = { success: true; recording: Recording } | { success: false; message: string };

/**
 * The script, spoken and saved.
 *
 * Synthesis happens in the system's temp directory because both engines only write to a path; the
 * finished mp3 is then moved into the recordings folder along with the text that was read, which is
 * what a video needs for its subtitles. Arguments go through `execFile` as an array, so nothing
 * here is handed to a shell.
 */
export async function speak(day: string, script: string): Promise<SpeechResult> {
  if (!dayPattern.test(day)) return { success: false, message: "Geçersiz gün." };
  const { engine, bin, model } = await pickEngine();
  const id = randomUUID();
  // The name carries the day it summarises and the time of the take, so two takes of the same day
  // sit side by side in Finder in the order they were made and neither can overwrite the other.
  const clock = new Date().toISOString().slice(11, 19).replace(/:/g, "");
  const filePath = join(recordingsDir(), `gunun-ozeti-${day}-${clock}.mp3`);
  const textPath = join(tmpdir(), `diji-speech-${id}.txt`);
  // Piper writes a WAV, `say` an AIFF; ffmpeg reads either, so only the extension differs.
  const rawPath = join(tmpdir(), `diji-speech-${id}.${engine === "piper" ? "wav" : "aiff"}`);
  const mp3Path = join(tmpdir(), `diji-speech-${id}.mp3`);
  try {
    // The script goes through a file rather than an argument: a minute of speech is well past the
    // comfortable length for a command line, and a file needs no quoting at all.
    await writeFile(textPath, script, "utf8");
    if (engine === "piper") {
      // A little more silence between sentences than the default: news read back to back runs
      // together otherwise.
      await run(bin, ["-m", model, "-f", rawPath, "-i", textPath, "--sentence-silence", "0.35"]);
    } else {
      await run("say", ["-v", sayVoice(), "-o", rawPath, "-f", textPath]);
    }
    await run("ffmpeg", ["-loglevel", "error", "-y", "-i", rawPath, "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", mp3Path]);
    const mp3 = await readFile(mp3Path);
    await mkdir(recordingsDir(), { recursive: true });
    await writeFile(filePath, mp3);
    const createdAt = new Date().toISOString();
    speechDatabase()
      .prepare("insert into speech_recordings (id, day, file, script, engine, bytes, created_at) values (?, ?, ?, ?, ?, ?, ?)")
      .run(id, day, filePath, script, engine, mp3.byteLength, createdAt);
    return { success: true, recording: { id, day, createdAt, bytes: mp3.byteLength, engine, script } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ENOENT") && message.includes("ffmpeg")) return { success: false, message: "ffmpeg bulunamadı. `brew install ffmpeg` ile kurun." };
    if (message.includes("ENOENT")) return { success: false, message: engine === "piper" ? "Piper çalıştırılamadı." : "`say` komutu bulunamadı. Bu özellik macOS'ta çalışır." };
    if (message.includes("Voice")) return { success: false, message: `Ses bulunamadı: ${sayVoice()}. Sistem Ayarları'ndan Türkçe sesi indirin.` };
    return { success: false, message: "Ses üretilemedi." };
  } finally {
    await Promise.all([rm(textPath, { force: true }), rm(rawPath, { force: true }), rm(mp3Path, { force: true })]);
  }
}
