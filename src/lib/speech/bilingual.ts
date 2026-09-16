export const speechLanguages = ["tr", "en"] as const;
export type SpeechLanguage = typeof speechLanguages[number];
export type Bilingual<T> = Record<SpeechLanguage, T>;

/** Existing local recordings are authoritative, including after reopening the modal. */
export function languagesNeedingRecording(recordings: Bilingual<readonly { script?: string }[]>, drafts?: Bilingual<string | null>) {
  return speechLanguages.filter(language => !recordings[language].length || (drafts?.[language] != null && drafts[language]!.trim() !== recordings[language][0].script?.trim()));
}

/** Each language has its own request and outcome; one failure never discards the other result. */
export async function runBilingualTasks(languages: readonly SpeechLanguage[], task: (language: SpeechLanguage) => Promise<{ success: boolean; message: string }>) {
  const results: Partial<Bilingual<{ success: boolean; message: string }>> = {};
  for (const language of languages) {
    try { results[language] = await task(language); }
    catch { results[language] = { success: false, message: "İşlem tamamlanamadı. Yeniden deneyin." }; }
  }
  return results;
}
