import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/services/settings";

/** The site name and description come from the panel, so the manifest is rendered per request. */
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();

  return {
    id: "/",
    name: settings.siteName,
    short_name: settings.siteName,
    description: settings.descriptionEn,
    // English is the default language, so the installed app opens on the English feed; a Turkish
    // reader still lands on Turkish through the language cookie the proxy sets.
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Keep iOS/Android launch and standalone chrome aligned with the opaque PWA status bar. The
    // page itself still switches between its light and dark canvases after launch.
    background_color: "#0f0f0f",
    theme_color: "#0f0f0f",
    categories: ["news", "magazines"],
    icons: [
      { src: "/icon-192.png?v=7", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=7", sizes: "512x512", type: "image/png", purpose: "any" },
      // Cropped to the launcher's own shape while keeping the entire binary mark inside the safe area.
      { src: "/icon-maskable-512.png?v=7", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
