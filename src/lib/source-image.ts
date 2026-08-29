import "server-only";

import { assertFetchableUrl, download } from "@/lib/net/remote";
import { extractSourceImage } from "@/lib/source-image-parser";

export async function discoverSourceImage(sourceUrl: string) {
  try {
    const safeSource = assertFetchableUrl(sourceUrl);
    const result = await download(safeSource, { timeoutMs: 8_000, maxBytes: 1024 * 1024, accept: "text/html,application/xhtml+xml;q=0.9" });
    if (!result) return null;
    const image = extractSourceImage(result.body, result.url);
    return image ? assertFetchableUrl(image) : null;
  } catch {
    // A missing or protected preview image must never prevent the post itself from being saved.
    return null;
  }
}
