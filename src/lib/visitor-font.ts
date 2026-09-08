/**
 * The reader's choice of reading face, stored and painted by name.
 *
 * Like `visitor-theme`, this lives outside the client component that renders the picker: the
 * pre-paint script and the settings sheet both need these names, and a `"use client"` module's
 * exports reach a Server Component as client references rather than as their values.
 *
 * Three faces, all chosen for legibility at a reading size rather than for character:
 * `hyperlegible` is Atkinson Hyperlegible — drawn by the Braille Institute to keep confusable
 * letterforms (I l 1, O 0) apart for low-vision readers — and it is the default; `serif` is
 * Source Serif 4; `sans` is IBM Plex Sans, already loaded for the interface.
 */

export type ReadingFont = "serif" | "sans" | "hyperlegible";

export const fontStorageKey = "diji-news-font";
export const fontAttribute = "data-visitor-font";

export const readingFonts: { value: ReadingFont; label: { tr: string; en: string } }[] = [
  { value: "hyperlegible", label: { tr: "Yüksek okunur", en: "Hyperlegible" } },
  { value: "serif", label: { tr: "Serif", en: "Serif" } },
  { value: "sans", label: { tr: "Sans", en: "Sans" } },
];

export function isReadingFont(value: string | null | undefined): value is ReadingFont {
  return value === "serif" || value === "sans" || value === "hyperlegible";
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
