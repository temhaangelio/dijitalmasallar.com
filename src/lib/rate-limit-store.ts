/** A bounded per-process window. Upstream/shared limits remain necessary across instances. */
export function createAttemptStore({ windowMs, maxAttempts, maxEntries = 5000 }: { windowMs: number; maxAttempts: number; maxEntries?: number }) {
  const entries = new Map<string, { count: number; resetAt: number }>();
  return {
    get size() { return entries.size; },
    consume(key: string, now = Date.now()) {
      const current = entries.get(key);
      if (current && current.resetAt > now) {
        current.count += 1;
        return current.count > maxAttempts;
      }
      if (!current && entries.size >= maxEntries) entries.delete(entries.keys().next().value!);
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    },
  };
}
