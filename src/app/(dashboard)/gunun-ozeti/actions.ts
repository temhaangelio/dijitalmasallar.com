"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { getPostsForDay } from "@/services/posts";
import { audioDuration, deleteRecording, isSpeechAvailable, listRecordings, readRecordingRow, speak, writeSpokenScript, type Recording } from "@/services/speech";
import { getPublishedDays, publishDailyAudio, unpublishDailyAudio } from "@/services/daily-audio";
import { readFile } from "node:fs/promises";
import type { Post } from "@/types/database";

type DayPosts = { success: boolean; message: string; posts: Post[]; scheduled: Post[]; recordings: Recording[]; published: boolean };

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * One day's notes, fetched when that day is opened.
 *
 * The list page knows only which days have notes and how many; the text itself is this call, so
 * opening the panel does not carry every note body of the last two months with it.
 */
export async function loadDayPostsAction(day: unknown, language: unknown): Promise<DayPosts> {
  const empty = { posts: [], scheduled: [], recordings: [], published: false };
  if (!(await getAuthorizedAdminClient())) return { success: false, message: "Bu işlem için yönetici yetkisi gerekir.", ...empty };
  if (typeof day !== "string" || !dayPattern.test(day)) return { success: false, message: "Geçersiz gün.", ...empty };

  const all = await getPostsForDay(day, language === "en" ? "en" : "tr");
  return {
    success: true,
    message: "",
    posts: all.filter((post) => post.status !== "scheduled"),
    scheduled: all.filter((post) => post.status === "scheduled").reverse(),
    recordings: isSpeechAvailable() ? listRecordings(day) : [],
    published: (await getPublishedDays(language === "en" ? "en" : "tr")).includes(day),
  };
}

type SpeechReply = { success: boolean; message: string; recordings: Recording[]; published?: boolean };

/**
 * The day's summary, read aloud and saved.
 *
 * Both halves run on this machine — the local model writes the spoken version, a local voice says
 * it — so the whole thing is gated on the same switch as the RSS reader and never exists in the
 * deployed site. The text comes from the panel rather than being re-composed here, so whatever the
 * editor changed in the box is what gets read. The mp3 is written into the recordings folder; only
 * its details come back.
 */
export async function createDaySpeechAction(day: unknown, text: unknown, rewrite: unknown): Promise<SpeechReply> {
  const failed = (message: string) => ({ success: false, message, recordings: [] });
  if (!(await getAuthorizedAdminClient())) return failed("Bu işlem için yönetici yetkisi gerekir.");
  if (!isSpeechAvailable()) return failed("Ses oluşturma yalnızca yerel geliştirme ortamında çalışır.");
  if (typeof day !== "string" || !dayPattern.test(day)) return failed("Geçersiz gün.");
  if (typeof text !== "string" || text.trim().length < 40) return failed("Seslendirilecek metin çok kısa.");
  // A day of notes is a few thousand characters; past this it is not a day summary any more.
  if (text.length > 20_000) return failed("Metin çok uzun.");

  let script = text.trim();
  if (rewrite !== false) {
    const written = await writeSpokenScript(script);
    if (!written.success) return failed(written.message);
    script = written.script;
  }

  const audio = await speak(day, script);
  if (!audio.success) return failed(audio.message);
  return { success: true, message: "", recordings: listRecordings(day) };
}

/** Removes one take: the row and the file behind it. */
export async function deleteRecordingAction(id: unknown, day: unknown): Promise<SpeechReply> {
  const failed = (message: string) => ({ success: false, message, recordings: [] });
  if (!(await getAuthorizedAdminClient())) return failed("Bu işlem için yönetici yetkisi gerekir.");
  if (!isSpeechAvailable()) return failed("Ses kayıtları yalnızca yerel geliştirme ortamında yönetilir.");
  if (typeof id !== "string" || !id) return failed("Geçersiz kayıt.");
  if (!(await deleteRecording(id))) return failed("Kayıt silinemedi.");
  return { success: true, message: "", recordings: typeof day === "string" && dayPattern.test(day) ? listRecordings(day) : [] };
}

type PublishReply = { success: boolean; message: string; published: boolean };

/**
 * Puts one take on the site, in one press.
 *
 * The file is read from the recordings folder rather than sent up from the browser: it is already
 * on this machine, and the panel is the only place that can reach it. Its length is measured here
 * so the player can say how long it runs before the audio has loaded.
 */
export async function publishRecordingAction(id: unknown, language: unknown): Promise<PublishReply> {
  const failed = (message: string) => ({ success: false, message, published: false });
  if (!(await getAuthorizedAdminClient())) return failed("Bu işlem için yönetici yetkisi gerekir.");
  if (!isSpeechAvailable()) return failed("Yayınlama yalnızca yerel geliştirme ortamında yapılır.");
  if (typeof id !== "string" || !id) return failed("Geçersiz kayıt.");

  const take = await readRecordingRow(id);
  if (!take) return failed("Kayıt bulunamadı.");

  let mp3: Buffer;
  try { mp3 = await readFile(take.file); } catch { return failed("Ses dosyası okunamadı."); }

  const result = await publishDailyAudio({
    day: take.day,
    language: language === "en" ? "en" : "tr",
    mp3,
    durationSeconds: await audioDuration(take.file),
    script: take.script,
  });
  if (!result.success) return failed(result.message);
  revalidatePath("/");
  return { success: true, message: "Kayıt yayımlandı.", published: true };
}

/** Takes the day's recording off the site. */
export async function unpublishDayAudioAction(day: unknown, language: unknown): Promise<PublishReply> {
  const failed = (message: string) => ({ success: false, message, published: true });
  if (!(await getAuthorizedAdminClient())) return failed("Bu işlem için yönetici yetkisi gerekir.");
  if (typeof day !== "string" || !dayPattern.test(day)) return failed("Geçersiz gün.");
  if (!(await unpublishDailyAudio(day, language === "en" ? "en" : "tr"))) return failed("Yayından kaldırılamadı.");
  revalidatePath("/");
  return { success: true, message: "Yayından kaldırıldı.", published: false };
}
