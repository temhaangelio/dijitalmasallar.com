import "server-only";

/**
 * Fetching a document from an address someone else chose.
 *
 * The RSS reader follows addresses that were typed into a form, so it needs three guarantees: the
 * address does not point back into our own network, the response cannot grow without bound, and a
 * source that never finishes responding does not hold a request open forever.
 */

export const defaultTimeoutMs = 15_000;
export const defaultMaxBytes = 5 * 1024 * 1024;

/**
 * Blocks the loopback and private ranges before a fetch leaves the server. The person adding a
 * source is an authenticated admin, so this is a guard rail rather than a boundary: it stops a
 * pasted internal address from turning the app into an unwitting proxy, and does not attempt to
 * defend against DNS rebinding.
 */
export function assertFetchableUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Geçerli bir adres girin.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Adres http veya https ile başlamalı.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isPrivate =
    host === "localhost" || host.endsWith(".localhost") || host === "::1" ||
    /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host) ||
    /^(fc|fd)[0-9a-f]{2}:/.test(host);
  if (isPrivate) throw new Error("Yerel ağ adresleri takip edilemez.");
  return url.toString();
}

/**
 * Reads the body a chunk at a time and gives up once it passes the cap, rather than calling
 * `response.text()` and discovering the size afterwards. A misconfigured source serving a hundred
 * megabytes should cost us a few kilobytes of transfer, not the process.
 */
export async function readCapped(response: Response, maxBytes = defaultMaxBytes) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Kaynak dosyası çok büyük.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return new TextDecoder("utf-8").decode(await new Blob(chunks as BlobPart[]).arrayBuffer());
}

export type DownloadOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  accept?: string;
  userAgent?: string;
  /** Conditional-request headers held from the previous fetch of the same address. */
  etag?: string | null;
  lastModified?: string | null;
};

const feedAccept = "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, text/html;q=0.8, */*;q=0.7";

/**
 * Returns `null` for a 304 rather than throwing: to a caller passing an ETag, "nothing changed" is
 * the good outcome, not a failure.
 */
export async function download(url: string, options: DownloadOptions = {}) {
  const headers: Record<string, string> = {
    accept: options.accept ?? feedAccept,
    "user-agent": options.userAgent ?? "diji.news RSS reader",
  };
  if (options.etag) headers["if-none-match"] = options.etag;
  if (options.lastModified) headers["if-modified-since"] = options.lastModified;

  const response = await fetch(url, {
    headers,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? defaultTimeoutMs),
  });
  if (response.status === 304) return null;
  if (!response.ok) throw new Error(`Kaynak ${response.status} yanıtı döndü.`);
  const body = await readCapped(response, options.maxBytes);
  if (!body.trim()) throw new Error("Kaynak boş yanıt döndü.");
  return { body, etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified"), url: response.url || url };
}
