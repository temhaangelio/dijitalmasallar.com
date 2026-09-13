/** Serve local audio with byte ranges so the browser can seek without a cloud URL. */
export function audioResponse(request: Request, take: { audio: Buffer; day: string; language: "tr" | "en"; format: "wav" | "mp3" }) {
  const size = take.audio.length;
  const headers = new Headers({
    "content-type": take.format === "mp3" ? "audio/mpeg" : "audio/wav",
    "accept-ranges": "bytes", "cache-control": "private, no-store",
    "content-disposition": `${new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="gunun-ozeti-${take.day}-${take.language}.${take.format}"`,
  });
  let start = 0;
  let end = size - 1;
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match && (match[1] || match[2])) {
      start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else { start = size; }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      headers.set("content-range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("content-range", `bytes ${start}-${end}/${size}`);
  }
  headers.set("content-length", String(end - start + 1));
  return new Response(new Uint8Array(take.audio.subarray(start, end + 1)), { status: range ? 206 : 200, headers });
}
