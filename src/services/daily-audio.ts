import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { VisitorLanguage } from "@/lib/visitor-language";

/**
 * The day summary's published recording.
 *
 * The mp3 lives in the same public bucket as the post covers, under its own prefix, and this table
 * says which day it belongs to and how long it runs. One row per day and language: publishing a day
 * again replaces both the row and the object, so a day never has two recordings on the site.
 */
export type DailyAudio = {
  day: string;
  language: VisitorLanguage;
  audioUrl: string;
  storagePath: string;
  durationSeconds: number;
  script: string;
  publishedAt: string;
};

const bucket = "diji-post-media";
const prefix = "gunun-ozeti";
const columns = "day,language,audio_url,storage_path,duration_seconds,script,published_at";

type Row = { day: string; language: string; audio_url: string; storage_path: string; duration_seconds: number; script: string; published_at: string };

function toAudio(row: Row): DailyAudio {
  return {
    day: row.day,
    language: row.language === "en" ? "en" : "tr",
    audioUrl: row.audio_url,
    storagePath: row.storage_path,
    durationSeconds: row.duration_seconds,
    script: row.script,
    publishedAt: row.published_at,
  };
}

/** A missing table is not an error worth breaking a page over; see `newsletter.ts` for the codes. */
function missingTable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/** What the feed plays: the newest published day in this language. */
export async function getLatestDailyAudio(language: VisitorLanguage): Promise<DailyAudio | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_summary_audio")
      .select(columns)
      .eq("language", language)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return toAudio(data as Row);
  } catch {
    return null;
  }
}

/** Which days already have a published recording, for the panel's list. */
export async function getPublishedDays(language: VisitorLanguage): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createAdminClient()
      .from("daily_summary_audio")
      .select("day")
      .eq("language", language);
    if (error) return [];
    return ((data ?? []) as { day: string }[]).map((row) => row.day);
  } catch {
    return [];
  }
}

export type PublishResult = { success: true; audio: DailyAudio } | { success: false; message: string };

/**
 * Puts one recording on the site.
 *
 * The object name carries the day and the minute it was published, so a replacement never lands on
 * the path a cached page is still pointing at; the previous object is removed once the new row is
 * written, not before, so a failure half way leaves the old recording playing rather than nothing.
 */
export async function publishDailyAudio(input: { day: string; language: VisitorLanguage; mp3: Buffer; durationSeconds: number; script: string }): Promise<PublishResult> {
  if (!isSupabaseConfigured()) return { success: false, message: "Supabase yapılandırılmamış." };
  try {
    const admin = createAdminClient();
    const previous = await admin.from("daily_summary_audio").select("storage_path").eq("day", input.day).eq("language", input.language).maybeSingle();
    if (previous.error && missingTable(previous.error)) {
      return { success: false, message: "daily_summary_audio tablosu yok. Veritabanı geçişini uygulayın." };
    }

    const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
    const storagePath = `${prefix}/${input.language}/${input.day}-${stamp}.mp3`;
    const upload = await admin.storage.from(bucket).upload(storagePath, input.mp3, { contentType: "audio/mpeg", upsert: false });
    if (upload.error) return { success: false, message: "Ses dosyası yüklenemedi." };

    const audioUrl = admin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    const row = {
      day: input.day,
      language: input.language,
      audio_url: audioUrl,
      storage_path: storagePath,
      duration_seconds: input.durationSeconds,
      script: input.script,
      published_at: new Date().toISOString(),
    };
    const saved = await admin.from("daily_summary_audio").upsert(row, { onConflict: "day,language" });
    if (saved.error) {
      await admin.storage.from(bucket).remove([storagePath]);
      return { success: false, message: missingTable(saved.error) ? "daily_summary_audio tablosu yok. Veritabanı geçişini uygulayın." : "Kayıt yayımlanamadı." };
    }

    const oldPath = (previous.data as { storage_path?: string } | null)?.storage_path;
    if (oldPath && oldPath !== storagePath) await admin.storage.from(bucket).remove([oldPath]);
    return { success: true, audio: toAudio(row as Row) };
  } catch {
    return { success: false, message: "Kayıt yayımlanamadı." };
  }
}

/** Takes the day's recording off the site, object included. */
export async function unpublishDailyAudio(day: string, language: VisitorLanguage) {
  if (!isSupabaseConfigured()) return false;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("daily_summary_audio").select("storage_path").eq("day", day).eq("language", language).maybeSingle();
    const { error } = await admin.from("daily_summary_audio").delete().eq("day", day).eq("language", language);
    if (error) return false;
    const path = (data as { storage_path?: string } | null)?.storage_path;
    if (path) await admin.storage.from(bucket).remove([path]);
    return true;
  } catch {
    return false;
  }
}
