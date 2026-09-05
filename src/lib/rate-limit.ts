import { headers } from "next/headers";
import { createAttemptStore } from "@/lib/rate-limit-store";

/** Best-effort per-instance abuse protection; the hosting proxy must sanitize client IP headers. */
export function createRateLimiter(options: { windowMs: number; maxAttempts: number }) {
  const attempts = createAttemptStore(options);
  return async function rateLimited() {
    const requestHeaders = await headers();
    const forwarded = process.env.VERCEL ? requestHeaders.get("x-vercel-forwarded-for") : requestHeaders.get("x-forwarded-for");
    const ip = (forwarded || requestHeaders.get("x-real-ip") || "unknown").split(",")[0].trim();
    return attempts.consume(ip);
  };
}
