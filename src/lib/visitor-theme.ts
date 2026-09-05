/**
 * The names and colours the visitor theme is stored and painted with.
 *
 * They live outside `components/features/visitor/theme.tsx` because that module carries a
 * `"use client"` directive, and every export of a client module reaches a Server Component as a
 * client reference rather than as its value — a server import of the cookie name arrived as a
 * function, so `cookies().get(...)` looked the reader's preference up under the wrong key and
 * silently found nothing. Anything both sides read belongs here instead.
 */

export type ThemePreference = "light" | "dark" | "system";

export const themeStorageKey = "diji-news-theme";
/** The same preference mirrored into a cookie, so a request can be rendered with the right colour. */
export const themeCookie = "diji-news-theme";
export const themeAttribute = "data-visitor-theme";
export const themeCookieMaxAge = 60 * 60 * 24 * 365;

export const lightThemeColor = "#fafafa";
export const darkThemeColor = "#0f0f0f";

export function isThemePreference(value: string | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
