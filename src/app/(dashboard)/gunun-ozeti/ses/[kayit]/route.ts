import { NextResponse } from "next/server";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { audioResponse } from "@/lib/speech/audio-response";
import { readRecordingFile } from "@/services/speech";

export const runtime = "nodejs";

/** Authenticate every request before serving a local draft, including downloads and seeking. */
export async function GET(request: Request, { params }: { params: Promise<{ kayit: string }> }) {
  if (!(await getAuthorizedAdminClient())) return new NextResponse(null, { status: 401 });
  const { kayit } = await params;
  const take = await readRecordingFile(kayit);
  if (!take) return new NextResponse(null, { status: 404 });
  return audioResponse(request, take);
}
