/** Use the selected bulletin day, including its weekday, rather than the recording date. */
export function speechOpening(day: string, language: "tr" | "en") {
  const date = new Date(`${day}T12:00:00+03:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) throw new Error("Geçersiz gün.");
  const label = new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul",
  }).format(date);
  return language === "tr"
    ? `dijitalmasallar.com tarafından hazırlanan ${label} tarihli bültene hoş geldiniz.`
    : `Welcome to the bulletin for ${label}, prepared by dijitalmasallar.com.`;
}

export function speechClosing(language: "tr" | "en") {
  return language === "tr"
    ? "dijitalmasallar.com tarafından hazırlanan bülteni dinlediniz, sağlıcakla kalın."
    : "You have been listening to the bulletin prepared by dijitalmasallar.com. Take care.";
}

export function initialSpeechScript(text: string, day: string, language: "tr" | "en") {
  const body = text.replace(/^[^\n]+ · Günün özeti\s*\n+/u, "").trim();
  return `${speechOpening(day, language)}\n\n${body}\n\n${speechClosing(language)}`;
}
