"use server";
import { getPublishedAudioQueue } from "@/services/daily-audio";

/** The modal only reads recordings already published for visitors. */
export async function loadListeningQueue(language: unknown) {
  if (language !== "tr" && language !== "en") return { items: [], error: true };
  return getPublishedAudioQueue(language);
}
