"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { deleteSubscriber, listNewsletterIssues, setSubscriberStatus } from "@/services/newsletter";
import { getIssuePreviews, sendDailyIssue, type SendTarget } from "@/services/newsletter-send";

type ActionResult = { success: boolean; message: string };

const denied: ActionResult = { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };

function address(value: unknown) {
  return typeof value === "string" && value.includes("@") && value.length <= 254 ? value : null;
}

export async function setSubscriberStatusAction(email: unknown, subscribed: unknown): Promise<ActionResult> {
  if (!(await getAuthorizedAdminClient())) return denied;
  const target = address(email);
  if (!target) return { success: false, message: "Geçersiz e-posta adresi." };
  const status = subscribed === true ? "subscribed" : "unsubscribed";
  const done = await setSubscriberStatus(target, status);
  if (!done) return { success: false, message: "Durum güncellenemedi. Lütfen tekrar deneyin." };
  revalidatePath("/bulten");
  return { success: true, message: status === "subscribed" ? "Abonelik yeniden açıldı." : "Abonelik kapatıldı." };
}

export async function deleteSubscriberAction(email: unknown): Promise<ActionResult> {
  if (!(await getAuthorizedAdminClient())) return denied;
  const target = address(email);
  if (!target) return { success: false, message: "Geçersiz e-posta adresi." };
  const done = await deleteSubscriber(target);
  if (!done) return { success: false, message: "Kayıt silinemedi. Lütfen tekrar deneyin." };
  revalidatePath("/bulten");
  return { success: true, message: "Kayıt silindi." };
}

/** `2026-09-15` and nothing else: the day is put into a query, so its shape is checked first. */
function dayKey(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

const languageName = { tr: "TR", en: "EN" } as const;

const sendFailure = {
  off: "E-bülten modülü kapalı.",
  mail: "Mail sağlayıcı anahtarı (MAIL_KEY) tanımlı değil.",
  empty: "Bu gün yayımlanmış not yok.",
  recipients: "Gönderilecek abone yok.",
  error: "Gönderim tamamlanamadı. Lütfen tekrar deneyin.",
} as const;

/**
 * Sends one day's issue to the list.
 *
 * The day is passed in rather than worked out here, so the button sends exactly the issue the panel
 * previewed — a click at 00:01 must not silently send a different day from the one on screen.
 *
 * A day that has already gone out is refused unless the panel says otherwise: the second send is a
 * real thing to want, when a first one half failed, but it is never what an accidental second click
 * means.
 */
/**
 * Reads the recipient choice the panel made.
 *
 * Every shape is checked rather than trusted: the addresses decide who a few hundred e-mails go to,
 * and they arrive from the browser. Anything unrecognised falls back to the whole list, which is
 * the bulletin's own meaning — never to a wider one, since there is nothing wider.
 */
function sendTarget(value: unknown): SendTarget {
  const target = value as { kind?: string; language?: string; emails?: unknown; email?: unknown } | null | undefined;
  if (target?.kind === "language") return { kind: "language", language: target.language === "en" ? "en" : "tr" };
  if (target?.kind === "addresses" && Array.isArray(target.emails)) {
    const emails = target.emails.filter((item): item is string => typeof item === "string" && item.includes("@") && item.length <= 254).slice(0, 5000);
    return { kind: "addresses", emails };
  }
  return { kind: "all" };
}

const targetName = (target: SendTarget) =>
  target.kind === "language" ? `${languageName[target.language]} aboneleri`
    : target.kind === "addresses" ? "seçili adresler"
      : "tüm aboneler";

/**
 * Sends one day's issue.
 *
 * The day is passed in rather than worked out here, so the button sends exactly the issue the panel
 * previewed — a click at 00:01 must not silently send a different day from the one on screen.
 *
 * A day that has already gone out is refused unless the panel says otherwise: the second send is a
 * real thing to want, when a first one half failed, but it is never what an accidental second click
 * means. A send to a few chosen addresses is not the day going out and is not held to that rule.
 */
export async function sendDailyIssueAction(day: unknown, resend: unknown, target: unknown = null): Promise<ActionResult> {
  if (!(await getAuthorizedAdminClient())) return denied;
  const target_ = sendTarget(target);
  const dayValue = dayKey(day);
  if (!dayValue) return { success: false, message: "Geçersiz gün." };
  if (target_.kind === "addresses" && !target_.emails.length) return { success: false, message: "Hiç adres seçilmedi." };

  if (resend !== true && target_.kind !== "addresses") {
    const issues = await listNewsletterIssues(50);
    if (issues.some((issue) => issue.day === dayValue)) {
      return { success: false, message: "Bu gün zaten gönderildi. Yeniden göndermek için onaylayın." };
    }
  }

  const result = await sendDailyIssue(dayValue, target_);
  if (!result.success) return { success: false, message: sendFailure[result.reason] };

  revalidatePath("/bulten");
  const sent = result.results.reduce((total, row) => total + row.sent, 0);
  const failed = result.results.reduce((total, row) => total + row.failed, 0);
  const detail = result.results
    .filter((row) => row.recipients)
    .map((row) => `${languageName[row.language]} ${row.sent}`)
    .join(", ");
  if (!sent) return { success: false, message: "Hiçbir e-posta gönderilemedi. Sağlayıcı kayıtlarını kontrol edin." };
  return {
    success: true,
    message: `${targetName(target_)}: ${sent} e-posta gönderildi${detail ? ` (${detail})` : ""}${failed ? ` · ${failed} başarısız` : ""}.`,
  };
}

/**
 * One copy to the signed-in editor, to read in a real inbox before the day goes anywhere.
 *
 * The address is the session's own and is never taken from the browser: a "test" that could be
 * pointed at any address is just an unlogged way of mailing strangers.
 */
export async function sendTestIssueAction(day: unknown, language: unknown): Promise<ActionResult> {
  const access = await getAuthorizedAdminClient();
  if (!access) return denied;
  const dayValue = dayKey(day);
  if (!dayValue) return { success: false, message: "Geçersiz gün." };

  const result = await sendDailyIssue(dayValue, { kind: "test", email: access.user.email, language: language === "en" ? "en" : "tr" });
  if (!result.success) return { success: false, message: sendFailure[result.reason] };
  const sent = result.results.reduce((total, row) => total + row.sent, 0);
  return sent
    ? { success: true, message: `Deneme iletisi ${access.user.email} adresine gönderildi.` }
    : { success: false, message: "Deneme iletisi gönderilemedi. Sağlayıcı kayıtlarını kontrol edin." };
}

export type IssueDayView = {
  language: "tr" | "en";
  paragraphs: string[];
  recipients: number;
  sent: { sentAt: string; sentCount: number; failedCount: number } | null;
};

export type LoadIssueResult = { success: true; day: string; views: IssueDayView[] } | { success: false; message: string };

/**
 * One day's issue as the panel shows it: the prose that would be sent, in both languages, and
 * whether that day has already gone out.
 *
 * The panel opens on yesterday and fetches any other day through here rather than on the page, so
 * looking through the archive never reloads the subscriber list underneath it.
 */
export async function loadIssueDayAction(day: unknown): Promise<LoadIssueResult> {
  if (!(await getAuthorizedAdminClient())) return { success: false, message: denied.message };
  const target = dayKey(day);
  if (!target) return { success: false, message: "Geçersiz gün." };

  const [previews, issues] = await Promise.all([getIssuePreviews(target), listNewsletterIssues(200)]);
  return {
    success: true,
    day: target,
    views: previews.map((preview) => {
      const issue = issues.find((row) => row.day === target && row.language === preview.language);
      return {
        language: preview.language,
        paragraphs: preview.paragraphs,
        recipients: preview.recipients,
        sent: issue ? { sentAt: issue.sentAt, sentCount: issue.sentCount, failedCount: issue.failedCount } : null,
      };
    }),
  };
}
