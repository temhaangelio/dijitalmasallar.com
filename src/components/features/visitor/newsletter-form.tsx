"use client";

import { useId, useState, useTransition } from "react";
import { ArrowRight, CircleAlert, LoaderCircle, MailCheck } from "lucide-react";
import { subscribeToNewsletterAction } from "@/app/actions/newsletter";
import { VisitorBottomSheet } from "@/components/features/visitor/visitor-bottom-sheet";
import type { VisitorLanguage } from "@/lib/visitor-language";

/**
 * The sign-up: one field, one action.
 *
 * A success is worth interrupting for, so it arrives as a sheet the reader dismisses — the page
 * behind it is a form that has just emptied itself, and without the sheet that reads as nothing
 * having happened. A failure is not worth a dialog: it belongs next to the field that caused it,
 * where the address is still on screen to be corrected.
 */
export function NewsletterForm({ language }: { language: VisitorLanguage }) {
  const fieldId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEnglish = language === "en";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await subscribeToNewsletterAction(email, language);
        if (!result.success) { setError(result.message); return; }
        setConfirmed(result.message);
        setSheetOpen(true);
        setEmail("");
      } catch {
        setError(isEnglish ? "Sign-up could not be completed. Please try again." : "Kayıt tamamlanamadı. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <>
      {confirmed ? (
        <p className="visitor-newsletter-reply visitor-sans" data-ok="true">
          <MailCheck size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>{confirmed}</span>
        </p>
      ) : (
        <form onSubmit={submit} noValidate>
          <label htmlFor={fieldId} className="visitor-newsletter-label visitor-sans">
            {isEnglish ? "E-mail address" : "E-posta adresi"}
          </label>
          <div className="visitor-newsletter-row">
            <input
              id={fieldId}
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="send"
              disabled={pending}
              placeholder={isEnglish ? "you@example.com" : "adresiniz@ornek.com"}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? messageId : undefined}
              className="visitor-newsletter-input visitor-sans"
            />
            <button type="submit" disabled={pending} className="visitor-newsletter-submit visitor-sans">
              {pending
                ? <LoaderCircle size={16} strokeWidth={2} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                : <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
              {pending ? (isEnglish ? "Sending…" : "Gönderiliyor…") : (isEnglish ? "Subscribe" : "Kaydol")}
            </button>
          </div>
          {error ? (
            <p id={messageId} role="alert" className="visitor-newsletter-reply visitor-sans">
              <CircleAlert size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
        </form>
      )}

      <VisitorBottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={isEnglish ? "You’re on the list" : "Kaydınız alındı"}
        closeLabel={isEnglish ? "Close" : "Kapat"}
        panelClassName="visitor-newsletter-sheet"
      >
        <p className="visitor-newsletter-sheet-copy visitor-sans">
          {isEnglish
            ? "The daily briefing will arrive in your inbox. You can leave any time, from a link in the e-mail."
            : "Günlük özet e-postanıza gelecek. İstediğiniz an, e-postadaki bağlantıdan çıkabilirsiniz."}
        </p>
        <button type="button" onClick={() => setSheetOpen(false)} className="visitor-newsletter-sheet-done visitor-sans">
          {isEnglish ? "Done" : "Tamam"}
        </button>
      </VisitorBottomSheet>
    </>
  );
}
