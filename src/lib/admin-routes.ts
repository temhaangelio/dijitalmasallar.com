/**
 * The routes that belong to the panel rather than to the site.
 *
 * Shared by every measurement surface: neither the reader analytics nor Google's tag should count
 * the editor working in the panel as an audience. Kept as one list because two lists drift, and the
 * one that drifts is always the one nobody looks at.
 */
const adminRoutePrefixes = [
  "/dashboard",
  "/yazilar",
  "/gunun-ozeti",
  "/bulten",
  "/rss",
  "/reklamlar",
  "/istatistik",
  "/profil",
  "/yerel-asistan",
  "/giris",
  "/sifremi-unuttum",
  "/sifre-yenile",
  "/auth",
];

/** Accepts a pathname or a full URL, since analytics callbacks hand over whichever they hold. */
export function isAdminRoute(url: string) {
  let pathname = url;
  if (url.includes("://") || url.startsWith("//")) {
    try {
      pathname = new URL(url, "http://localhost").pathname;
    } catch {
      pathname = url.split(/[?#]/, 1)[0];
    }
  } else {
    pathname = url.split(/[?#]/, 1)[0];
  }
  return adminRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
