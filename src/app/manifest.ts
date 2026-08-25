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
    background_color: "#efefef",
    theme_color: "#efefef",
    categories: ["news", "magazines"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Cropped to the launcher's own shape, so the mark is centred with room around it.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", short_name: "Search", url: "/search", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
