import "server-only";

/**
 * The one place the site talks to its mail provider.
 *
 * Resend over plain `fetch` rather than its SDK: the whole of what we need is one POST, and the
 * provider is reached from server code only — the key never leaves the server, the same way the
 * Supabase service-role key does not.
 */

const endpoint = "https://api.resend.com/emails/batch";

/** Resend accepts a hundred messages in one call; more than that is a second call. */
const batchSize = 100;

/** The free plan allows two requests a second, so batches are spaced rather than fired at once. */
const betweenBatchesMs = 600;

export function isMailConfigured() {
  return Boolean(process.env.MAIL_KEY?.trim());
}

/**
 * `Dijital Masallar <bulten@dijitalmasallar.com>`.
 *
 * The domain is the one verified with the provider; a different sender would be rejected outright.
 * It stays overridable so a rename does not need a deploy of this file.
 */
export function mailFrom() {
  return process.env.MAIL_FROM?.trim() || "Dijital Masallar <bulten@dijitalmasallar.com>";
}

export type OutgoingMail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** `List-Unsubscribe` and friends: one header set per reader, because the link is the reader's. */
  headers?: Record<string, string>;
};

export type SendResult = { sent: number; failed: number };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends one message per reader, in batches.
 *
 * One message per address rather than one message with many recipients: a bulletin that listed its
 * own readers in the `To:` line would hand every subscriber the whole list. A batch that the
 * provider refuses counts as failed and the rest are still attempted — a single bad address must
 * not stop the day's send — and the counts come back so the panel can say what actually happened.
 */
export async function sendMailBatch(messages: OutgoingMail[]): Promise<SendResult> {
  const key = process.env.MAIL_KEY?.trim();
  if (!key || !messages.length) return { sent: 0, failed: messages.length };

  const from = mailFrom();
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < messages.length; index += batchSize) {
    const batch = messages.slice(index, index + batchSize);
    if (index) await wait(betweenBatchesMs);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(batch.map((message) => ({
          from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.headers ? { headers: message.headers } : {}),
        }))),
      });
      if (!response.ok) {
        // The body carries the provider's own reason; the addresses it refers to do not belong in a
        // log, so only the status and the message are kept.
        const detail = await response.text().catch(() => "");
        console.error("Newsletter batch rejected", { status: response.status, detail: detail.slice(0, 300) });
        failed += batch.length;
        continue;
      }
      const body = await response.json().catch(() => null) as { data?: unknown[] } | null;
      const accepted = Array.isArray(body?.data) ? body.data.length : batch.length;
      sent += accepted;
      failed += batch.length - accepted;
    } catch (error) {
      console.error("Newsletter batch failed", { message: error instanceof Error ? error.message : "unknown" });
      failed += batch.length;
    }
  }

  return { sent, failed };
}
