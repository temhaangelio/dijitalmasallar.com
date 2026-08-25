import type { VisitorLanguage } from "@/lib/visitor-language";

/**
 * Every visitor-facing date is written in the newsroom's own time zone, not the reader's: a note
 * published at 00:40 in Istanbul belongs to that Istanbul day wherever it is being read.
 *
 * The feed, the daily brief and the article page all format the same three shapes, so they live
 * here rather than being re-declared next to each page.
 */
const timeZone = "Europe/Istanbul";

function locale(language: VisitorLanguage) {
  return language === "en" ? "en-US" : "tr-TR";
}

/** `14:05` — the time gutter next to a note. */
export function timeLabel(value: string, language: VisitorLanguage) {
  return new Intl.DateTimeFormat(locale(language), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(value));
}

/** `Pazartesi, 25 Ağustos` — the separator that opens a new day in the feed. */
export function dateLabel(value: string, language: VisitorLanguage) {
  return new Intl.DateTimeFormat(locale(language), { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(value));
}

/** `25 Ağustos 2026` — the dateline on an article. */
export function fullDateLabel(value: string, language: VisitorLanguage) {
  return new Intl.DateTimeFormat(locale(language), { day: "numeric", month: "long", year: "numeric", timeZone }).format(new Date(value));
}

/** `2026-08-25`, only ever compared to another key — never shown to a reader. */
export function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(new Date(value));
}

/**
 * The day separator's label. Today and yesterday are named rather than dated: in a feed people read
 * several times a day, "Bugün" places a note faster than a weekday and a number do. Older days keep
 * the weekday and date, and the full date is still available in the separator's tooltip.
 */
export function relativeDayLabel(value: string, language: VisitorLanguage) {
  const day = dateKey(value);
  const now = Date.now();
  if (day === dateKey(new Date(now).toISOString())) return language === "en" ? "Today" : "Bugün";
  if (day === dateKey(new Date(now - 24 * 60 * 60 * 1000).toISOString())) return language === "en" ? "Yesterday" : "Dün";
  return dateLabel(value, language);
}
