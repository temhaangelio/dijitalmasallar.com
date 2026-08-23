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
