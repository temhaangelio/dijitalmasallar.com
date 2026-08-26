import "server-only";

/** The RSS reader is a local editor tool and must not be exposed in production. */
export function isLocalToolAvailable() {
  return process.env.NODE_ENV !== "production";
}
