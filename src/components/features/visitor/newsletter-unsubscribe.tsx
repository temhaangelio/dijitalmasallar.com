"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleAlert, LoaderCircle, MailCheck } from "lucide-react";
import { unsubscribeFromNewsletterAction } from "@/app/actions/newsletter";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * Leaving the list.
 *
 * The link in a message opens this page rather than unsubscribing on its own: an inbox provider
 * that follows every link it is sent — scanning for malware, generating previews — would otherwise
 * take a reader off the list without a person ever having asked. The removal happens on the button,
 * which only a reader can press. The one-click header on the message is the exception, and it is a
 * POST to the endpoint under `/api`, which no scanner issues.
 */
export function NewsletterUnsubscribe({ token, language }: { token: string; language: VisitorLanguage }) {
  const isEnglish = language === "en";
  const [pending, startTransition] = useTransition();
  const [reply, setReply] = useState<{ success: boolean; message: string } | null>(null);

  function leave() {
    if (pending) return;
    startTransition(async () => {
      try {
        setReply(await unsubscribeFromNewsletterAction(token, language));
      } catch {
        setReply({ success: false, message: isEnglish ? "The request could not be completed. Please try again." : "İşlem tamamlanamadı. Lütfen tekrar deneyin." });
      }
    });
  }

  if (reply) {
    return (
      <div className="visitor-card">
        <p role="status" className="visitor-newsletter-reply visitor-sans" data-ok={reply.success ? "true" : undefined}>
          {reply.success
            ? <MailCheck size={18} strokeWidth={1.7} aria-hidden="true" />
            : <CircleAlert size={16} strokeWidth={1.8} aria-hidden="true" />}
          <span>{reply.message}</span>
        </p>
        <p className="visitor-newsletter-terms visitor-sans" style={{ marginTop: 18 }}>
          <Link href={languageHref("/", language)} className="underline underline-offset-2">
            {isEnglish ? "Back to the notes" : "Notlara dön"}
          </Link>
          {reply.success ? (
            <>
              {" · "}
              <Link href={languageHref("/ebulten", language)} className="underline underline-offset-2">
                {isEnglish ? "Sign up again" : "Yeniden kaydol"}
              </Link>
            </>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className="visitor-card">
      <p className="visitor-newsletter-lead visitor-sans" style={{ marginTop: 0 }}>
        {isEnglish
          ? "You will no longer receive the daily briefing. You can sign up again at any time."
          : "Günlük özet artık e-postanıza gelmeyecek. Dilediğiniz an yeniden kaydolabilirsiniz."}
      </p>
      <div className="visitor-newsletter-signup" style={{ marginTop: 20 }}>
        <button type="button" onClick={leave} disabled={pending} className="visitor-newsletter-submit visitor-sans">
          {pending ? <LoaderCircle size={16} strokeWidth={2} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
          {pending
            ? (isEnglish ? "Leaving…" : "Çıkarılıyor…")
            : (isEnglish ? "Unsubscribe" : "Listeden çık")}
        </button>
        <p className="visitor-newsletter-terms visitor-sans">
          <Link href={languageHref("/", language)} className="underline underline-offset-2">
            {isEnglish ? "Stay on the list" : "Listede kal"}
          </Link>
        </p>
      </div>
    </div>
  );
}
