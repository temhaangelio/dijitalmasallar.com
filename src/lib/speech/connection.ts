/** Only retry failures known to occur before an HTTP request reaches Google. */
const preConnectionCodes = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "UND_ERR_CONNECT_TIMEOUT"]);
const knownCodes = new Set([...preConnectionCodes, "ECONNRESET", "ETIMEDOUT", "UND_ERR_SOCKET", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"]);

export function connectionCodes(error: unknown): string[] {
  if (!error || typeof error !== "object") return [];
  const item = error as { code?: unknown; cause?: unknown; errors?: unknown[] };
  return [...(typeof item.code === "string" && knownCodes.has(item.code) ? [item.code] : []),
    ...connectionCodes(item.cause), ...(Array.isArray(item.errors) ? item.errors.flatMap(connectionCodes) : [])];
}

export async function fetchSpeech(fetcher: typeof fetch, url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try { return await fetcher(url, options); }
    catch (error) {
      if (options.signal?.aborted) throw error;
      const codes = connectionCodes(error);
      // Socket resets and response timeouts may already have incurred a charge. Never retry them.
      if (attempt === 0 && codes.length && codes.every(code => preConnectionCodes.has(code))) continue;
      console.error("[speech:connection]", { codes, attempts: attempt + 1 });
      const detail = codes.some(code => code === "ENOTFOUND" || code === "EAI_AGAIN")
        ? "Google ses servisinin adresi çözümlenemedi. İnternet veya DNS bağlantınızı kontrol edin."
        : codes.includes("UND_ERR_CONNECT_TIMEOUT")
          ? "Google ses servisine bağlantı zaman aşımına uğradı."
          : "Google ses servisiyle bağlantı kesildi. Tamamlanan kayıtlar korundu; eksik kaydı yeniden deneyebilirsiniz.";
      throw new Error(detail, { cause: error });
    }
  }
}
