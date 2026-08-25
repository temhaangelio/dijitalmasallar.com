import { headers } from "next/headers";

/**
 * A per-IP limiter for the public server actions — newsletter sign-up, push subscription.
 *
 * It is deliberately in-memory: the counters live in one server instance and reset on deploy, which
 * is enough to stop a single client hammering an endpoint, and avoids a round-trip to the database
 * on every attempt. A distributed limit would need shared storage.
 */
export function createRateLimiter({ windowMs, maxAttempts }: { windowMs: number; maxAttempts: number }) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return async function rateLimited() {
    const requestHeaders = await headers();
    const ip = (requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown").split(",")[0].trim();
    const now = Date.now();
    const current = attempts.get(ip);
    if (!current || current.resetAt <= now) {
      attempts.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    current.count += 1;
    // The oldest key is dropped rather than the whole map, so one busy period cannot grow unbounded.
    if (attempts.size > 5000) attempts.delete(attempts.keys().next().value ?? ip);
    return current.count > maxAttempts;
  };
}
