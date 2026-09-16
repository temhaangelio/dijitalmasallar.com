import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/services/newsletter";
import { getAppUrl } from "@/lib/env";

/**
 * The address behind every message's `List-Unsubscribe` header.
 *
 * Mail clients that support one-click unsubscribe POST here without showing the reader anything, so
 * this has to remove the address and answer 200 — a redirect or an error page would leave the
 * client reporting that unsubscribing failed. Anything that arrives as a GET is a person following
 * the link, and they are sent to the page where a button asks first.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const result = await unsubscribeByToken(token);
  if (result === "error") return new NextResponse("error", { status: 500 });
  // An unknown token is answered 200 as well: the reader is not on the list either way, and a 404
  // here only makes a mail client show a failure for something that needs no action.
  return new NextResponse("ok", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const target = new URL("/ebulten/cikis", getAppUrl());
  const token = query.get("t");
  if (token) target.searchParams.set("t", token);
  if (query.get("lang") === "en") target.searchParams.set("lang", "en");
  return NextResponse.redirect(target, 302);
}
