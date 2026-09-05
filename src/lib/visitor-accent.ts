export const accentStorageKey = "diji-news-accent";
export const accentAttribute = "data-visitor-accent";
export const accentChangedEvent = "diji-news-accent-change";

export const accentOptions = [
  { id: "neutral", tr: "Antrasit", en: "Anthracite", light: "#363a3d", dark: "#d2d5d7" },
  { id: "petrol", tr: "Petrol", en: "Petrol", light: "#16666d", dark: "#66bfc5" },
  { id: "red", tr: "Kırmızı", en: "Red", light: "#b33332", dark: "#f1847b" },
  { id: "gold", tr: "Altın", en: "Gold", light: "#806015", dark: "#d5b65c" },
] as const;
export type AccentPreference = typeof accentOptions[number]["id"];
export function isAccentPreference(value: unknown): value is AccentPreference {
  return accentOptions.some(option => option.id === value);
}

/** A saved choice wins; otherwise the active theme selects its own accent. */
export function resolveAccentPreference(value: unknown, theme: string | null): AccentPreference {
  return isAccentPreference(value) ? value : theme === "dark" ? "gold" : "red";
}
