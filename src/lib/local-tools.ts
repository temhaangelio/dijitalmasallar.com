import "server-only";

/** Local editor tools must not be exposed in production. */
export function isLocalToolAvailable() {
  return process.env.NODE_ENV !== "production";
}
