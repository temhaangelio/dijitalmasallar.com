import "server-only";

import { getAppUrl } from "@/lib/env";
import { isMailConfigured, sendMailBatch, type OutgoingMail } from "@/lib/mail";
import { renderIssue, issueSubject } from "@/lib/newsletter/issue";
import { postPlainText } from "@/lib/post-content";
import { bulletinDays } from "@/lib/visitor-date";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { getPostsForDay } from "@/services/posts";
import { listSendableSubscribers, recordNewsletterIssue } from "@/services/newsletter";
import { getSiteSettings } from "@/services/settings";

/**
 * One day's notes, as a letter.
 *
 * The bulletin is always about a finished day rather than the last twenty-four hours: a day that is
 * over has a fixed set of notes, so what the panel previews is exactly what the readers receive, and
 * a send that is repeated produces the same issue instead of a slightly different one. Yesterday is
 * the day the panel opens on; any earlier day can be chosen and sent the same way.
 */

const languages: readonly VisitorLanguage[] = ["tr", "en"];

/** The Istanbul day the next issue covers. */
export function issueDay(now = new Date()) {
  return bulletinDays(now).yesterday;
}

export type IssuePreview = {
  language: VisitorLanguage;
  subject: string;
  /** The day's notes as prose, one paragraph per note, oldest first. */
  paragraphs: string[];
  recipients: number;
};

function absolute(path: string) {
  return `${getAppUrl()}${path}`;
}

/**
 * One note as one paragraph — the same composition the podcast script uses.
 *
 * The note's own `# heading` is dropped: it is where the title comes from, so in continuous prose it
 * would arrive twice, once as a stray fragment and again as the sentence that follows it. Internal
 * paragraph breaks are flattened for the same reason the recording flattens them: a note that
 * arrives as three short blocks reads as three items rather than as one account.
 */
function toParagraph(post: { title: string; excerpt: string; body: string }) {
  const body = post.body.replace(/^#\s+[^\n]+\n+/i, "");
  // The title is the last resort rather than a nicety: a note whose body is nothing but its heading
  // or a picture would otherwise come out empty and be dropped, and the day would quietly be one
  // note short of what the panel's own feed shows.
  return (postPlainText(body) || post.excerpt || post.title).replace(/\n{2,}/g, " ").replace(/\s{2,}/g, " ").trim();
}

/**
 * What one language's issue would contain, without sending anything.
 *
 * The panel renders this, and `sendDailyIssue` builds the messages from the same call — so the
 * preview cannot drift from the send.
 */
export async function getIssuePreview(day: string, language: VisitorLanguage): Promise<IssuePreview> {
  const [posts, subscribers] = await Promise.all([
    getPostsForDay(day, language),
    listSendableSubscribers(language),
  ]);
  // Oldest first: the message reads down the day the way it happened, where the feed reads back up it.
  const ordered = [...posts].reverse();
  return {
    language,
    subject: issueSubject(day, language),
    paragraphs: ordered.map(toParagraph).filter(Boolean),
    recipients: subscribers.length,
  };
}

export async function getIssuePreviews(day: string): Promise<IssuePreview[]> {
  return Promise.all(languages.map((language) => getIssuePreview(day, language)));
}

/** The rendered message for one reader — the panel's preview route uses it with a dummy token. */
export async function renderIssueForPreview(day: string, language: VisitorLanguage) {
  const settings = await getSiteSettings();
  const preview = await getIssuePreview(day, language);
  return renderIssue({
    day,
    language,
    siteName: settings.siteName,
    paragraphs: preview.paragraphs,
    siteUrl: absolute(languageHref("/", language)),
    unsubscribeUrl: absolute(languageHref("/ebulten/cikis", language, { t: "onizleme" })),
  });
}

export type LanguageSendResult = {
  language: VisitorLanguage;
  notes: number;
  recipients: number;
  sent: number;
  failed: number;
};

/**
 * Who this send is for.
 *
 * `all` is the bulletin as such: everybody, each in the language they signed up in. The narrower
 * shapes exist for the times an issue is not a broadcast — one language's readers, a handful of
 * addresses being checked, or a single copy to the editor before the real thing goes out. Only a
 * send that covers a language completely is written to the issue log, because only that one is what
 * "bu gün gönderildi" means.
 */
export type SendTarget =
  | { kind: "all" }
  | { kind: "language"; language: VisitorLanguage }
  | { kind: "addresses"; emails: string[] }
  | { kind: "test"; email: string; language: VisitorLanguage };

export type SendIssueResult =
  | { success: true; day: string; results: LanguageSendResult[] }
  | { success: false; reason: "off" | "mail" | "empty" | "recipients" | "error"; day: string };

/**
 * Sends one day's issue to every subscriber, each in the language they signed up in.
 *
 * Nothing is sent for a language with no notes or no readers — an empty bulletin is worse than no
 * bulletin — and a language that is skipped leaves the other one free to go out. The record is
 * written per language after the provider has answered, so the panel's "gönderildi" line reflects
 * what left rather than what was attempted.
 */
export async function sendDailyIssue(day: string, target: SendTarget = { kind: "all" }): Promise<SendIssueResult> {
  const settings = await getSiteSettings();
  if (!settings.moduleNewsletter) return { success: false, reason: "off", day };
  if (!isMailConfigured()) return { success: false, reason: "mail", day };

  try {
    const previews = await getIssuePreviews(day);
    if (!previews.some((preview) => preview.paragraphs.length)) return { success: false, reason: "empty", day };

    if (target.kind === "test") return sendTestCopy(day, target, previews, settings.siteName);

    const wanted = target.kind === "addresses" ? new Set(target.emails.map((email) => email.trim().toLowerCase())) : null;
    const results: LanguageSendResult[] = [];

    for (const preview of previews) {
      const { language, paragraphs } = preview;
      if (!paragraphs.length || (target.kind === "language" && target.language !== language)) {
        results.push({ language, notes: paragraphs.length, recipients: 0, sent: 0, failed: 0 });
        continue;
      }
      const everyone = await listSendableSubscribers(language);
      const subscribers = wanted ? everyone.filter((row) => wanted.has(row.email)) : everyone;
      if (!subscribers.length) {
        results.push({ language, notes: paragraphs.length, recipients: 0, sent: 0, failed: 0 });
        continue;
      }

      const siteUrl = absolute(languageHref("/", language));
      const messages: OutgoingMail[] = subscribers.map((subscriber) => {
        const unsubscribeUrl = absolute(languageHref("/ebulten/cikis", language, { t: subscriber.unsubscribeToken }));
        const { subject, html, text } = renderIssue({
          day,
          language,
          siteName: settings.siteName,
          paragraphs,
          siteUrl,
          unsubscribeUrl,
        });
        return {
          to: subscriber.email,
          subject,
          html,
          text,
          /*
           * The header is what puts "Listeden çık" in Gmail's own chrome, next to the sender, and
           * what a mail client uses instead of making the reader find the link at the foot of the
           * message. It points at the endpoint rather than the page, because one-click means the
           * client POSTs it without a person ever seeing a screen.
           */
          headers: {
            "List-Unsubscribe": `<${absolute(`/api/ebulten/cikis?t=${subscriber.unsubscribeToken}`)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      });

      const { sent, failed } = await sendMailBatch(messages);
      /* A send to a handful of chosen addresses is not the day's issue going out, so it leaves the
         log alone: the panel would otherwise show the day as sent to everybody. */
      if (target.kind !== "addresses") await recordNewsletterIssue({
        day,
        language,
        subject: preview.subject,
        postCount: paragraphs.length,
        recipientCount: subscribers.length,
        sentCount: sent,
        failedCount: failed,
      });
      results.push({ language, notes: paragraphs.length, recipients: subscribers.length, sent, failed });
    }

    if (!results.some((row) => row.recipients)) return { success: false, reason: "recipients", day };
    return { success: true, day, results };
  } catch (error) {
    console.error("Newsletter send failed", { message: error instanceof Error ? error.message : "unknown" });
    return { success: false, reason: "error", day };
  }
}

/**
 * One copy, to the editor's own address, before the day goes to anybody else.
 *
 * The subject is marked so the copy can never be mistaken for the issue itself in an inbox, the
 * unsubscribe link is the placeholder the preview uses — there is no subscription to end — and
 * nothing is written to the log: this send did not happen as far as the readers are concerned.
 */
async function sendTestCopy(day: string, target: { email: string; language: VisitorLanguage }, previews: IssuePreview[], siteName: string): Promise<SendIssueResult> {
  const preview = previews.find((item) => item.language === target.language);
  if (!preview?.paragraphs.length) return { success: false, reason: "empty", day };

  const { subject, html, text } = renderIssue({
    day,
    language: target.language,
    siteName,
    paragraphs: preview.paragraphs,
    siteUrl: absolute(languageHref("/", target.language)),
    unsubscribeUrl: absolute(languageHref("/ebulten/cikis", target.language, { t: "deneme" })),
  });

  const { sent, failed } = await sendMailBatch([{ to: target.email, subject: `[Deneme] ${subject}`, html, text }]);
  return {
    success: true,
    day,
    results: [{ language: target.language, notes: preview.paragraphs.length, recipients: 1, sent, failed }],
  };
}
