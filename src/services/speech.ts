import type { TransitionSound } from "@/lib/speech/transition-samples";
import "server-only";
import { mkdir, access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { speechDatabase } from "@/lib/speech/local-db";
import { LocalRecordings } from "@/lib/speech/local-recordings";
import { GEMINI_TTS_MODEL } from "@/lib/speech/options";
import { generateGeminiSpeech, type GeminiVoice } from "@/lib/speech/gemini";
export type { Recording } from "@/lib/speech/local-recordings";

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const apiKey = () => process.env.GEMINI_API_KEY?.trim() || "";
export const isSpeechAvailable = isLocalToolAvailable;
export const isGeminiConfigured = () => Boolean(apiKey());
export const recordingsDir = () => process.env.SPEECH_DIR?.trim() || join(process.cwd(), "ses-kayitlari");
function recordings() {
  if (!isSpeechAvailable()) throw new Error("Ses taslakları yalnızca yerel ortamda kullanılabilir.");
  return new LocalRecordings(speechDatabase(), recordingsDir());
}
export async function listRecordings(day: string, language: "tr" | "en" = "tr") {
  return isSpeechAvailable() ? recordings().list(day, language) : [];
}
export async function listRecordingDays(language: "tr" | "en") {
  return isSpeechAvailable() ? recordings().days(language) : [];
}
export async function readRecordingRow(id: string) {
  return isSpeechAvailable() ? recordings().get(id) : null;
}
export async function readRecordingFile(id: string) {
  return isSpeechAvailable() ? recordings().read(id) : null;
}
export async function deleteRecording(id: string) {
  return isSpeechAvailable() ? recordings().delete(id) : false;
}
async function withSpeechLock<T>(work: () => Promise<T>): Promise<T> {
  return recordings().withLock(work);
}

const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Ses işlemi tamamlanamadı.";

export async function speak(day: string, script: string, voice: GeminiVoice, language: "tr" | "en", newsTransitions = false, transitionSound: TransitionSound = "warm") {
  if (!dayPattern.test(day)) return { success: false as const, message: "Geçersiz gün." };
  if (!apiKey()) return { success: false as const, message: "Sunucuda GEMINI_API_KEY tanımlı değil." };
  try {
    return await withSpeechLock(async () => {
      const existing = recordings().list(day, language)[0];
      if (existing) return { success: true as const, recording: existing };
      await mkdir(recordingsDir(), { recursive: true });
      await access(recordingsDir(), constants.W_OK);
      const introPcm = await readFile(join(process.cwd(), "assets", "audio", "podcast-intro.pcm"));
      const result = await generateGeminiSpeech(script, voice, language, apiKey(), undefined, { newsTransitions, transitionSound, introPcm });
      const recording = await recordings().save({ day, language, engine: GEMINI_TTS_MODEL, voice, script, durationSeconds: result.durationSeconds }, result.wav);
      return { success: true as const, recording };
    });
  } catch (error) { return { success: false as const, message: failureMessage(error) }; }
}
