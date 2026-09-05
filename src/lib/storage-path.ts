/** Only delete objects from our own public bucket, never a path embedded in an external URL. */
export function publicStoragePath(value: unknown, bucket: string, projectUrl: string | undefined): string | null {
  if (typeof value !== "string" || !projectUrl) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.split(/[/?#]/).some(segment => segment === "." || segment === "..") || /%[0-9a-f]{2}/i.test(decoded)) return null;
    const url = new URL(value);
    const project = new URL(projectUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (url.origin !== project.origin || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path || /[\\\x00-\x1f]/.test(path) || path.split("/").some(segment => !segment || segment === "." || segment === "..")) return null;
    return path;
  } catch {
    return null;
  }
}
