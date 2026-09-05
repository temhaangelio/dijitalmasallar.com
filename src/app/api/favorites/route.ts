import { NextResponse, type NextRequest } from "next/server";
import { getPostsByIds, maxPostsByIds } from "@/services/posts";
import { resolveVisitorLanguage } from "@/lib/visitor-language";

/**
 * The notes behind a reader's saved ids.
 *
 * Favourites are kept in `localStorage`, so only the browser knows which notes to ask for. This is
 * the endpoint it asks through, and it hands back nothing the feed does not already publish: the
 * ids arrive from the client, `getPostsByIds` drops anything that is not a uuid, caps the list, and
 * excludes notes whose publication time has not arrived.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = (searchParams.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (ids.length > maxPostsByIds) {
    return NextResponse.json({ error: "too_many_ids" }, { status: 400 });
  }
  const language = resolveVisitorLanguage(searchParams.get("lang"));
  const posts = await getPostsByIds(ids, language);
  // Per reader and per device; there is nothing here a shared cache should hold on to.
  return NextResponse.json({ posts }, { headers: { "cache-control": "private, no-store" } });
}
