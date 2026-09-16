/**
 * One day's notes as an e-mail.
 *
 * The day arrives as prose, not as an index: paragraphs that follow one another, no timestamps, no
 * numbering and no headlines — the same shape the podcast script takes, for the same reason. A
 * bulletin that lists five items with times reads as five things to get through; the day told as a
 * few paragraphs reads as the day.
 *
 * Deliberately dependency-free, like `post-content.ts`: the subject line, the markup and the plain
 * text alternative are the part of sending worth testing on its own, and a module that imports
 * nothing can be run straight from the test file.
 *
 * The markup is written the way mail is written rather than the way the site is: one centred table,
 * every colour and size inline, no stylesheet and no web font. Mail clients strip `<style>` blocks,
 * ignore classes and re-flow anything that relies on modern layout, so the site's own components
 * cannot be reused here — but its palette can, and the values below are the tokens from
 * `globals.css` spelled out.
 */

export type IssueInput = {
  /** `2026-09-15`, the Istanbul day the notes belong to. */
  day: string;
  language: "tr" | "en";
  siteName: string;
  /** The day's notes, one paragraph each, oldest first. */
  paragraphs: string[];
  /** Absolute link to the feed, in the reader's language. */
  siteUrl: string;
  /** Absolute link carrying this one reader's unsubscribe token. */
  unsubscribeUrl: string;
};

export type RenderedIssue = { subject: string; html: string; text: string };

const words = {
  tr: {
    subject: "Günün notları",
    greeting: "Gündemde bunlar vardı.",
    allNotes: "Tüm notlar",
    why: "Bu e-postayı dijitalmasallar.com e-bültenine kaydolduğunuz için aldınız.",
    unsubscribe: "Listeden çık",
  },
  en: {
    subject: "Notes from the day",
    greeting: "Here is what the day held.",
    allNotes: "All notes",
    why: "You are receiving this because you signed up for the dijitalmasallar.com newsletter.",
    unsubscribe: "Unsubscribe",
  },
} as const;

const ink = "#0a0a0a";
const ink2 = "#4a4a4a";
const muted = "#6a6a6a";
const line = "#ededed";
const canvas = "#efefef";
const surface = "#ffffff";
/** Atkinson Hyperlegible is not installable in mail, so the stack is what every client already has. */
const family = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** `15 Eylül 2026 Salı` — written in Istanbul time, the day the notes belong to. */
export function issueDateLabel(day: string, language: "tr" | "en") {
  const date = new Date(`${day}T12:00:00+03:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime())) throw new Error("Geçersiz gün.");
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul",
  }).format(date);
}

/**
 * `Günün notları · 15 Eylül 2026 Salı`.
 *
 * The date is in the subject rather than only in the body because two issues sitting next to each
 * other in an inbox are otherwise indistinguishable, and because a mail client that threads by
 * subject would fold the whole bulletin into one conversation.
 */
export function issueSubject(day: string, language: "tr" | "en") {
  return `${words[language].subject} · ${issueDateLabel(day, language)}`;
}

/** The line inboxes show next to the subject; without one they show the first markup they find. */
function preheader(input: IssueInput) {
  const opening = input.paragraphs[0] ?? "";
  return opening.length > 140 ? `${opening.slice(0, 139).trimEnd()}…` : opening;
}

/**
 * The whole message: subject, markup and a plain text alternative.
 *
 * Rendered once per reader rather than once per issue, because the unsubscribe link is the reader's
 * own. The list is a few hundred addresses and this is string building, so the cost is nothing
 * next to the send itself.
 */
export function renderIssue(input: IssueInput): RenderedIssue {
  const language = input.language;
  const text = words[language];
  const subject = issueSubject(input.day, language);
  const dateLabel = issueDateLabel(input.day, language);

  /* The opening paragraph is set a size larger: it is the one an inbox previews and the one a reader
     decides on, and the step down afterwards is what makes the rest read as the body of a letter. */
  const body = input.paragraphs
    .map((paragraph, index) => `
              <p style="margin:${index ? "18px" : "0"} 0 0;font:400 ${index ? "16px/1.75" : "17px/1.7"} ${family};color:${index ? ink2 : ink};">${escapeHtml(paragraph)}</p>`)
    .join("");

  const html = `<!doctype html>
<html lang="${language}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader(input))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${canvas};">
  <tr>
    <td align="center" style="padding:28px 16px 40px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${surface};border:1px solid ${line};border-radius:16px;">
        <tr>
          <td style="padding:30px 30px 0;">
            <a href="${escapeHtml(input.siteUrl)}" style="font:700 13px/1 ${family};color:${ink};text-decoration:none;letter-spacing:0.02em;">${escapeHtml(input.siteName)}</a>
            <h1 style="margin:14px 0 0;font:700 23px/1.3 ${family};color:${ink};">${escapeHtml(dateLabel)}</h1>
            <p style="margin:6px 0 0;font:400 14px/1.6 ${family};color:${muted};">${escapeHtml(text.greeting)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 30px 0;border-top:1px solid ${line};" >
            <div style="padding-top:4px;">${body}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 30px 32px;">
            <a href="${escapeHtml(input.siteUrl)}" style="display:inline-block;padding:13px 22px;background:${ink};border-radius:999px;font:600 14px/1 ${family};color:${surface};text-decoration:none;">${escapeHtml(text.allNotes)}</a>
          </td>
        </tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:18px 30px 0;text-align:center;font:400 12px/1.6 ${family};color:${muted};">
            ${escapeHtml(text.why)}<br>
            <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${muted};text-decoration:underline;">${escapeHtml(text.unsubscribe)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const plain = [
    `${input.siteName} — ${dateLabel}`,
    "",
    text.greeting,
    "",
    input.paragraphs.join("\n\n"),
    "",
    `${text.allNotes}: ${input.siteUrl}`,
    "",
    text.why,
    `${text.unsubscribe}: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text: plain };
}
