import { NextResponse } from "next/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isSpeechAvailable, readRecordingFile } from "@/services/speech";

/**
 * A saved recording, played from disk.
 *
 * The audio element points here rather than at a blob built from a base64 reply: the file already
 * exists on the machine, so sending it through a server action would only copy a megabyte into the
 * page for no reason. The URL carries the recording's id and the path comes from its database row,
 * so nothing in the address reaches the file system.
 *
 * The route sits under `/gunun-ozeti`, which the middleware already gates, and checks the session
 * again here — a route handler is reachable on its own.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ kayit: string }> }) {
  if (!isSpeechAvailable()) return new NextResponse(null, { status: 404 });
  if (!(await getAuthorizedAdminClient())) return new NextResponse(null, { status: 401 });

  const { kayit } = await params;
  const found = await readRecordingFile(kayit);
  if (!found) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(found.mp3), {
    headers: {
      "content-type": "audio/mpeg",
      "content-length": String(found.mp3.byteLength),
      "cache-control": "no-store",
      "content-disposition": `inline; filename="gunun-ozeti-${found.day}.mp3"`,
    },
  });
}
