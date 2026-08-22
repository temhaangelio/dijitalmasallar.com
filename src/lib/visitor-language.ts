import "server-only";

import { headers } from "next/headers";

export type VisitorLanguage = "tr" | "en";

export async function getVisitorLanguage(explicitLanguage?: string): Promise<VisitorLanguage> {
  if (explicitLanguage === "tr" || explicitLanguage === "en") return explicitLanguage;

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const preferredLanguage = acceptLanguage.split(",", 1)[0]?.trim().toLowerCase();
  return preferredLanguage === "tr" || preferredLanguage?.startsWith("tr-") ? "tr" : "en";
}
