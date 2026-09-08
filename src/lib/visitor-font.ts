/**
 * The reader's choice of reading face, stored and painted by name.
 *
 * Like `visitor-theme`, this lives outside the client component that renders the picker: the
 * pre-paint script and the settings sheet both need these names, and a `"use client"` module's
 * exports reach a Server Component as client references rather than as their values.
 *
 * Two faces. `hyperlegible` is Atkinson Hyperlegible Next — the site's one family, drawn by the
 * Braille Institute to keep confusable letterforms (I l 1, O 0) apart — and it is the default;
 * `serif` is Source Serif 4 for readers who want a serif for long reads. (A stored `sans` from an
 * earlier build falls back to the default.)
 */

export type ReadingFont = "hyperlegible" | "serif";

export const fontStorageKey = "diji-news-font";
export const fontAttribute = "data-visitor-font";

export const readingFonts: { value: ReadingFont; label: { tr: string; en: string } }[] = [
  { value: "hyperlegible", label: { tr: "Sans", en: "Sans" } },
  { value: "serif", label: { tr: "Serif", en: "Serif" } },
];

export function isReadingFont(value: string | null | undefined): value is ReadingFont {
  return value === "hyperlegible" || value === "serif";
}

/**
 * The reading size, on the same shelf as the face: three steps around the design's own measure,
 * stored by name and painted as a multiplier the text rules scale by.
 */

export type TextSize = "small" | "normal" | "large";

export const textSizeStorageKey = "diji-news-text-size";
export const textSizeAttribute = "data-visitor-text";

export const textSizes: { value: TextSize; label: { tr: string; en: string } }[] = [
  { value: "small", label: { tr: "Küçük", en: "Small" } },
  { value: "normal", label: { tr: "Normal", en: "Normal" } },
  { value: "large", label: { tr: "Büyük", en: "Large" } },
];

export function isTextSize(value: string | null | undefined): value is TextSize {
  return value === "small" || value === "normal" || value === "large";
}
