export type VisitorLanguage = "tr" | "en";

/**
 * English is the primary language, so a URL without a `lang` parameter serves English and only
 * Turkish is marked explicitly. That also means `?lang=en` never has to appear in a link.
 *
 * Accept-Language sniffing was removed along with this: if the header could turn a parameter-less
 * URL Turkish, `/about` would mean "English" in a link and "Turkish" on a Turkish browser, and
 * the language switch would look broken. The choice is now carried entirely by the URL.
 */
export const defaultVisitorLanguage: VisitorLanguage = "en";

export function resolveVisitorLanguage(explicitLanguage?: string | null): VisitorLanguage {
  return explicitLanguage === "tr" ? "tr" : defaultVisitorLanguage;
}

/** Builds an in-app link that only carries `?lang=` for the non-default language. */
export function languageHref(path: string, language: VisitorLanguage, extraQuery?: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (language !== defaultVisitorLanguage) params.set("lang", language);
  for (const [key, value] of Object.entries(extraQuery ?? {})) params.set(key, String(value));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
