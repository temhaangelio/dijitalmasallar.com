"use server";
import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { MAX_SPEECH_CHARS } from "@/lib/speech/options";
import { getPostsForDay } from "@/services/posts";
import { deleteRecording, listRecordings, readRecordingFile, readRecordingRow, speak, type Recording } from "@/services/speech";
import { getPublishedDays, publishDailyAudio, unpublishDailyAudio } from "@/services/daily-audio";
import type { Post } from "@/types/database";

type DayPosts = { success: boolean; message: string; posts: Post[]; scheduled: Post[]; recordings: Recording[]; published: boolean };
type SpeechReply = { success: boolean; message: string; recordings: Recording[] };
type PublishReply = { success: boolean; message: string; published: boolean };
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const validText = (text: unknown): text is string => typeof text === "string" && text.trim().length >= 40 && text.length <= MAX_SPEECH_CHARS;
const failed = (message: string): SpeechReply => ({ success: false, message, recordings: [] });

export async function loadDayPostsAction(day: unknown, language: unknown): Promise<DayPosts> {
  const empty = { posts: [], scheduled: [], recordings: [], published: false };
  if (!(await getAuthorizedAdminClient())) return { success: false, message: "Yönetici yetkisi gerekir.", ...empty };
  if (typeof day !== "string" || !dayPattern.test(day) || (language !== "en" && language !== "tr")) return { success: false, message: "Geçersiz gün veya dil.", ...empty };
  try {
    const [all, audio, published] = await Promise.all([getPostsForDay(day, language), listRecordings(day, language).then((recordings) => ({ recordings, message: "" })).catch(() => ({ recordings: [] as Recording[], message: "Yerel ses kayıtları okunamadı. Kayıt klasörü ve veritabanı izinlerini kontrol edin." })), getPublishedDays(language)]);
    return { success: true, message: audio.message, posts: all.filter((post) => post.status !== "scheduled" && (post.body.trim() || post.excerpt.trim())), scheduled: all.filter((post) => post.status === "scheduled" && (post.body.trim() || post.excerpt.trim())).reverse(), recordings: audio.recordings, published: published.includes(day) };
  } catch { return { success: false, message: "Günün notları veya ses kayıtları alınamadı.", ...empty }; }
}

export async function createDaySpeechAction(day: unknown, text: unknown, language: unknown): Promise<SpeechReply> {
  if (!(await getAuthorizedAdminClient())) return failed("Yönetici yetkisi gerekir.");
  if (typeof day !== "string" || !dayPattern.test(day)) return failed("Geçersiz gün.");
  if (!validText(text)) return failed("Ses metni 40–6.000 karakter arasında olmalı.");
  if (language !== "tr" && language !== "en") return failed("Geçersiz ses veya dil.");
  const result = await speak(day, text.trim(), "Kore", language, true, "warm");
  if (!result.success) return failed(result.message);
  revalidatePath("/gunun-ozeti");
  try { return { success: true, message: "", recordings: await listRecordings(day, language) }; }
  catch { return { success: true, message: "Kayıt oluşturuldu. Listeyi yenileyin.", recordings: [result.recording] }; }
}

export async function deleteRecordingAction(id: unknown, day: unknown, language: unknown): Promise<SpeechReply> {
  if (!(await getAuthorizedAdminClient())) return failed("Yönetici yetkisi gerekir.");
  if (typeof id !== "string" || typeof day !== "string" || !dayPattern.test(day) || (language !== "tr" && language !== "en")) return failed("Geçersiz kayıt.");
  const row = await readRecordingRow(id);
  if (!row || row.day !== day || row.language !== language) return failed("Kayıt bulunamadı.");
  if (!(await deleteRecording(id))) return failed("Kayıt silinemedi.");
  revalidatePath("/gunun-ozeti");
  return { success: true, message: "", recordings: await listRecordings(day, language) };
}

export async function publishRecordingAction(id: unknown, language: unknown): Promise<PublishReply> {
  const fail = (message: string) => ({ success: false, message, published: false });
  if (!(await getAuthorizedAdminClient())) return fail("Yönetici yetkisi gerekir.");
  if (typeof id !== "string" || (language !== "tr" && language !== "en")) return fail("Geçersiz kayıt.");
  const take = await readRecordingFile(id);
  if (!take || take.language !== language) return fail("Bu dilde kayıt bulunamadı.");
  const result = await publishDailyAudio({ day: take.day, language: take.language, audio: take.audio, durationSeconds: take.durationSeconds, script: take.script, format: take.format });
  if (!result.success) return fail(result.message);
  revalidatePath("/");
  revalidatePath("/dinle");
  revalidatePath("/gunun-ozeti");
  return { success: true, message: "Kayıt yayımlandı.", published: true };
}

export async function unpublishDayAudioAction(day: unknown, language: unknown): Promise<PublishReply> {
  const fail = (message: string) => ({ success: false, message, published: true });
  if (!(await getAuthorizedAdminClient())) return fail("Yönetici yetkisi gerekir.");
  if (typeof day !== "string" || !dayPattern.test(day) || (language !== "tr" && language !== "en")) return fail("Geçersiz gün veya dil.");
  if (!(await unpublishDailyAudio(day, language))) return fail("Yayından kaldırılamadı.");
  revalidatePath("/");
  revalidatePath("/dinle");
  revalidatePath("/gunun-ozeti");
  return { success: true, message: "Yayından kaldırıldı.", published: false };
}
