import { SPEECH_INTRO_SECONDS } from "./options.ts";
import { isSpeechFrame } from "./transition.ts";

/** A planning estimate at 145 words/minute, not the provider's generation time. */
export function estimatedSpeechSeconds(text: string, transitions: boolean): number {
  const words = text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  if (!words) return 0;
  const stories = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/u)
    .filter(paragraph => paragraph.trim() && !isSpeechFrame(paragraph)).length;
  return SPEECH_INTRO_SECONDS + words * 60 / 145 + (transitions ? Math.max(0, stories - 1) * 0.9 : 0);
}

export function estimatedSpeechDuration(text: string, transitions: boolean): string {
  const seconds = Math.ceil(estimatedSpeechSeconds(text, transitions));
  return `${Math.floor(seconds / 60)} dk ${String(seconds % 60).padStart(2, "0")} sn`;
}
