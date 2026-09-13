import { speechClosing } from "./script-text.ts";
import { mixClosingMusic } from "./outro.ts";
import { fetchSpeech } from "./connection.ts";
import type { TransitionSound } from "./transition-samples.ts";
import { GEMINI_TTS_MODEL, MAX_SPEECH_CHARS, isGeminiVoice, type GeminiVoice } from "./options.ts";
import { isSpeechFrame, newsTransitionPcm } from "./transition.ts";
export type { GeminiVoice } from "./options.ts";

/** Short chunks limit long-form TTS drift; preserve every word in order. */
export function speechChunks(text: string, limit = 700): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const sentence of text.trim().split(/(?<=[.!?])\s+|\n+/u)) {
    if (current && current.length + sentence.length + 1 > limit) {
      chunks.push(current);
      current = "";
    }
    for (const word of sentence.split(/\s+/u).filter(Boolean)) {
      if (word.length > limit) throw new Error("Metinde çok uzun bir kelime veya bağlantı var.");
      if (current && current.length + word.length + 1 > limit) { chunks.push(current); current = ""; }
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** News boundaries stay distinct from the provider's length-based chunks. */
export function speechPlan(text: string, newsTransitions: boolean) {
  if (!newsTransitions) return speechChunks(text).map(text => ({ text, transition: false }));
  let hasNews = false;
  return text.replace(/\r\n?/g, "\n").split(/\n\s*\n/u).filter(paragraph => paragraph.trim()).flatMap(paragraph => {
    const isNews = !isSpeechFrame(paragraph);
    const transition = isNews && hasNews;
    if (isNews) hasNews = true;
    return speechChunks(paragraph).map((text, index) => ({ text, transition: transition && index === 0 }));
  });
}

export function pcmToWav(pcm: Buffer): Buffer {
  if (!pcm.length || pcm.length % 2) throw new Error("Gemini geçerli bir ses dosyası döndürmedi.");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

type GeminiReply = {
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
};

/** Only pre-connection failures are retried; uncertain provider responses are never retried. */
export async function generateGeminiSpeech(text: string, voice: GeminiVoice, language: "tr" | "en", apiKey: string, fetcher: typeof fetch = fetch, options: { newsTransitions?: boolean; transitionSound?: TransitionSound; introPcm?: Buffer } = {}) {
  if (!apiKey) throw new Error("Gemini API anahtarı eksik. Sunucuya GEMINI_API_KEY ekleyin.");
  if (!isGeminiVoice(voice)) throw new Error("Geçersiz Gemini sesi.");
  if (!text.trim() || text.length > MAX_SPEECH_CHARS) throw new Error("Ses metni en fazla 6.000 karakter olabilir.");
  if (options.introPcm && (!options.introPcm.length || options.introPcm.length % 2)) throw new Error("Intro ses dosyası geçersiz.");
  const chunks = speechPlan(text, options.newsTransitions === true);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240_000);
  const audio: Buffer[] = options.introPcm ? [options.introPcm] : [];
  let totalBytes = options.introPcm?.length ?? 0;
  let closingStart = -1;
  try {
    for (const chunk of chunks) {
      const response = await fetchSpeech(fetcher, `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`, {
        method: "POST", signal: controller.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: [
            `Read the transcript verbatim in ${language === "tr" ? "Turkish" : "English"}.`,
            "Sound like a warm, natural person explaining today's technology news. Use a steady conversational pace, clear articulation and understated expression. Avoid a formal announcer or advertising voice.",
            "Pronounce English brand and product names naturally in English within the narration. Do not translate, rewrite, add a greeting or read these directions aloud.",
            `TRANSCRIPT:\n${chunk.text}`,
          ].join("\n") }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        }),
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("Gemini kotası veya hız sınırı aşıldı. Google hesabınızın kullanımını kontrol edin.");
        if ([401, 403].includes(response.status)) throw new Error("Gemini API anahtarı veya model erişimi geçersiz.");
        throw new Error(`Gemini ses üretimini tamamlayamadı (HTTP ${response.status}).`);
      }
      const reply = await response.json() as GeminiReply;
      const candidate = reply.candidates?.[0];
      if (reply.promptFeedback?.blockReason || candidate?.finishReason !== "STOP") throw new Error("Gemini kaydı tamamlamadı. Metni kısaltıp yeniden deneyin.");
      const parts = candidate.content?.parts?.filter((part) => part.inlineData?.data) ?? [];
      if (!parts.length) throw new Error("Gemini boş bir ses yanıtı döndürdü.");
      if (audio.length) { const pause = chunk.transition ? newsTransitionPcm(options.transitionSound) : Buffer.alloc(12000); audio.push(pause); totalBytes += pause.length; }
      if (chunk.text.trim() === speechClosing(language)) closingStart = totalBytes;
      for (const part of parts) {
        const { mimeType, data } = part.inlineData!;
        if (!/^audio\/L16(?:;|$)/i.test(mimeType ?? "") || !/rate=24000(?:;|$)/i.test(mimeType ?? "")) throw new Error("Gemini beklenmeyen bir ses biçimi döndürdü.");
        if (!data || data.length > 48_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("Gemini geçersiz ses verisi döndürdü.");
        const pcm = Buffer.from(data, "base64");
        if (!pcm.length || pcm.length % 2) throw new Error("Gemini ses verisi eksik.");
        totalBytes += pcm.length;
        if (totalBytes > 40_000_000) throw new Error("Ses dosyası çok uzun. Özeti kısaltın.");
        audio.push(pcm);
      }
    }
    const narration = Buffer.concat(audio);
    const finished = options.introPcm && closingStart >= 0 ? mixClosingMusic(narration, options.introPcm, closingStart) : narration;
    return { wav: pcmToWav(finished), durationSeconds: Math.ceil(finished.length / 48000) };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Gemini ses üretimi zaman aşımına uğradı. Özeti kısaltıp yeniden deneyin.");
    throw error;
  } finally { clearTimeout(timer); }
}
