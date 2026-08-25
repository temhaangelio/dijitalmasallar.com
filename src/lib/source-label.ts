export function sourceLabel(sourceName: string | null | undefined, sourceUrl: string | null | undefined, fallback: string) {
  const name = sourceName?.trim();
  if (name) return name;
  if (!sourceUrl) return fallback;

  try {
    return new URL(sourceUrl).hostname.replace(/^www\./i, "") || fallback;
  } catch {
    return fallback;
  }
}

function sourceDomainName(sourceUrl: string | null | undefined) {
  if (!sourceUrl) return null;

  try {
    const labels = new URL(sourceUrl).hostname.replace(/^www\./i, "").split(".").filter(Boolean);
    if (labels.length < 2) return labels[0] ?? null;

    const topLevel = labels.at(-1) ?? "";
    const secondLevel = labels.at(-2) ?? "";
    // Google uses its brand TLD for properties such as blog.google, safety.google and ai.google.
    if (topLevel === "google") return topLevel;
    const usesCountrySuffix = labels.length > 2 && topLevel.length === 2 && secondLevel.length <= 3;
    return labels.at(usesCountrySuffix ? -3 : -2) ?? null;
  } catch {
    return null;
  }
}

export function sourceBadgeInitials(sourceUrl: string | null | undefined, fallback: string, language: "tr" | "en") {
  const name = sourceDomainName(sourceUrl) || fallback.trim();
  return name.slice(0, 2).toLocaleUpperCase(language === "en" ? "en-US" : "tr-TR");
}
