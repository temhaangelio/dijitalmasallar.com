export type VisitorLanguage = "tr" | "en";

/**
 * English is the primary language, so a URL without a `lang` parameter serves English and only
 * Turkish is marked explicitly. Ordinary English links therefore stay clean; the language picker
 * may use `?lang=en` once so the proxy can remember an explicit user preference.
 *
 * Browser-language detection happens in proxy.ts before rendering. Turkish visitors are redirected
 * to the explicit `?lang=tr` URL, keeping rendered pages and canonical URLs deterministic.
 */
export const defaultVisitorLanguage: VisitorLanguage = "en";
export const visitorLanguageCookie = "diji_visitor_language";

export function resolveVisitorLanguage(explicitLanguage?: string | null): VisitorLanguage {
  return explicitLanguage === "tr" ? "tr" : defaultVisitorLanguage;
}

/** Only a primarily Turkish browser selects Turkish; every other primary language falls to English. */
export function languageFromAcceptLanguage(header?: string | null): VisitorLanguage {
  const preferred = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [tag = "", ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), quality: Number.isFinite(parsedQuality) ? parsedQuality : 0, index };
    })
    .filter(({ tag, quality }) => tag && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)[0]?.tag;

  return preferred === "tr" || preferred?.startsWith("tr-") ? "tr" : defaultVisitorLanguage;
}

/** Builds an in-app link that only carries `?lang=` for the non-default language. */
export function languageHref(path: string, language: VisitorLanguage, extraQuery?: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (language !== defaultVisitorLanguage) params.set("lang", language);
  for (const [key, value] of Object.entries(extraQuery ?? {})) params.set(key, String(value));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
