import "server-only";

import { isLocalToolAvailable } from "@/lib/local-tools";

/**
 * The RSS reader persists to a local SQLite file and is intentionally a local development tool.
 * Production builds must neither advertise nor execute it, regardless of the database setting.
 */
export function isRssReaderAvailable() {
  return isLocalToolAvailable();
}
