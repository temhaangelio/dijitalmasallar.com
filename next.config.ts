import type { NextConfig } from "next";

/**
 * Cover and ad images live in public Supabase Storage buckets. The exact host is derived from the
 * configured project so the allow-list stays as narrow as possible; the wildcard is only a fallback
 * for environments where the variable is not present at build time.
 */
function supabaseImageHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const storagePath = "/storage/v1/object/public/**";
const imageHost = supabaseImageHost();

/**
 * Headers that cannot break Next's inline bootstrap scripts. A full script-src CSP would need a
 * per-request nonce, so it is deliberately left out rather than shipped in a broken state.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.61"],
  poweredByHeader: false,
  images: {
    remotePatterns: imageHost
      ? [{ protocol: "https", hostname: imageHost, pathname: storagePath }]
      : [{ protocol: "https", hostname: "**.supabase.co", pathname: storagePath }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The worker must never be served from a stale copy: a cached `sw.js` keeps an old push
        // handler alive for as long as the browser holds it. `Service-Worker-Allowed` lets the file
        // claim the whole origin even though it is served from `/public`.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    // The public routes were renamed when English became the primary language. Kept permanently so
    // shared links and search results do not break.
    return [
      { source: "/hakkinda", destination: "/about", permanent: true },
      // The reader's own preferences moved onto the about page; the old address keeps working.
      { source: "/settings", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
