export const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
export const GEMINI_VOICES = ["Charon", "Kore", "Puck", "Aoede"] as const;
export type GeminiVoice = typeof GEMINI_VOICES[number];
export const MAX_SPEECH_CHARS = 6_000;

export function isGeminiVoice(value: unknown): value is GeminiVoice {
  return GEMINI_VOICES.some((voice) => voice === value);
}

/** Supplied intro (5.250625 s) followed by a quarter-second pause before narration. */
export const SPEECH_INTRO_SECONDS = 5.500625;
