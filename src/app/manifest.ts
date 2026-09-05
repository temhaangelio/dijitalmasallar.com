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
    // The light canvas: the value the browser paints around the app while it starts.
    background_color: "#fafafa",
    theme_color: "#fafafa",
    categories: ["news", "magazines"],
    icons: [
      { src: "/icon-192.png?v=6", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=6", sizes: "512x512", type: "image/png", purpose: "any" },
      // Cropped to the launcher's own shape while keeping the entire binary mark inside the safe area.
      { src: "/icon-maskable-512.png?v=6", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
