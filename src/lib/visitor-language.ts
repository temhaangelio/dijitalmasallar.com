export type VisitorLanguage = "tr" | "en";

/**
 * Turkish is the primary language. URLs without a `lang` parameter serve Turkish; English is
 * always represented explicitly with `?lang=en`, keeping canonical URLs deterministic.
 */
export const defaultVisitorLanguage: VisitorLanguage = "tr";

export function resolveVisitorLanguage(explicitLanguage?: string | null): VisitorLanguage {
  return explicitLanguage === "en" ? "en" : defaultVisitorLanguage;
}

/** Browser preference remains available for callers that explicitly want language detection. */
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

  return preferred === "en" || preferred?.startsWith("en-") ? "en" : defaultVisitorLanguage;
}

/** Builds an in-app link that only carries `?lang=` for the non-default language. */
export function languageHref(path: string, language: VisitorLanguage, extraQuery?: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (language !== defaultVisitorLanguage) params.set("lang", language);
  for (const [key, value] of Object.entries(extraQuery ?? {})) params.set(key, String(value));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
