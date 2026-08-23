/**
 * `next/image` throws when a remote host is not in `images.remotePatterns`, which would turn one bad
 * stored URL into a 500 on the public feed. Uploads always land in the project's own Supabase
 * Storage, so anything else falls back to a plain `<img>` instead of taking the page down.
 */
export function isOptimizableImage(url: string | null | undefined): url is string {
  if (!url) return false;
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!configured) return false;
  try {
    const image = new URL(url);
    return image.protocol === "https:" && image.hostname === new URL(configured).hostname && image.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
}
