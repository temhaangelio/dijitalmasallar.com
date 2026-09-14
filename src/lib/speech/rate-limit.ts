import { setTimeout as delay } from "node:timers/promises";
import { fetchSpeech } from "./connection.ts";

type QuotaReply = { error?: { details?: Array<{ "@type"?: string; retryDelay?: string; violations?: Array<{ quotaId?: string; quotaMetric?: string; quotaValue?: string }> }> } };

export async function speechRateLimit(response: Response) {
  const body = await response.json().catch(() => ({})) as QuotaReply | null;
  const details = Array.isArray(body?.error?.details) ? body.error.details : [];
  const violations = details.flatMap(detail => Array.isArray(detail.violations) ? detail.violations : []);
  const daily = violations.some(item => /perday|per_day/iu.test(`${item.quotaId ?? ""} ${item.quotaMetric ?? ""}`));
  const unavailable = violations.some(item => String(item.quotaValue) === "0");
  const retry = details.find(detail => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo")?.retryDelay;
  const header = response.headers.get("retry-after");
  const seconds = retry && /^\d+(?:\.\d+)?s$/u.test(retry) ? Math.ceil(parseFloat(retry))
    : header && /^\d+$/u.test(header) ? Number(header) : 0;
  if (unavailable) return { seconds: 0, message: "Gemini TTS için bu API projesinin kotası sıfır. Google AI Studio’da API anahtarının bağlı olduğu projenin model kotasını ve faturalandırmasını kontrol edin." };
  if (daily) return { seconds: 0, message: "Gemini TTS günlük API kotası doldu. Kota yenilendiğinde yeniden deneyin veya Google AI Studio’da projenizin limitini kontrol edin." };
  return {
    seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 0,
    message: seconds > 0
      ? `Gemini TTS hız sınırına takıldı. Google ${seconds} saniye sonra yeniden denemenizi istiyor. Tamamlanan kayıtlar korundu.`
      : "Google ses isteğini kota veya hız sınırı nedeniyle reddetti (429). Google AI Studio’da API projesinin kullanım limitlerini kontrol edin. Tamamlanan kayıtlar korundu.",
  };
}

/** Retry only an explicitly rejected request, with Google's delay, once within a bounded wait. */
export async function fetchSpeechWithRateLimit(fetcher: typeof fetch, url: string, options: RequestInit,
  wait = (ms: number) => delay(ms, undefined, { signal: options.signal ?? undefined })) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetchSpeech(fetcher, url, options);
    if (response.status !== 429) return response;
    const limit = await speechRateLimit(response);
    if (attempt === 0 && limit.seconds > 0 && limit.seconds <= 60) {
      await wait(limit.seconds * 1000);
      continue;
    }
    throw new Error(limit.message);
  }
}
