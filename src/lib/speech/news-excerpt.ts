import { isSpeechFrame } from "./transition.ts";

/** Use a real news sentence from the published recording, skipping its greeting and closing. */
export function recordingNewsExcerpt(script: string, language: "tr" | "en") {
  const paragraph = script.split(/\n\s*\n/u).map(part => part.trim()).find(part => part && !isSpeechFrame(part));
  if (!paragraph) return "";
  const text = paragraph.replace(/\s+/gu, " ");
  const sentences = new Intl.Segmenter(language, { granularity: "sentence" }).segment(text);
  return sentences[Symbol.iterator]().next().value?.segment.trim() ?? text;
}
