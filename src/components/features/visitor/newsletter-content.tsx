"use client";

import { useId } from "react";
import { NewsletterForm } from "./newsletter-form";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** The sign-up, in the feed's language: a headline, a line of serif, one field. */
export function NewsletterContent({ language, modal = false }: { language: VisitorLanguage; modal?: boolean }) {
  const isEnglish = language === "en";
  const headingId = useId();
  return (
    <section className="feed-newsletter-page" aria-labelledby={headingId}>
      <span className="feed-newsletter-eyebrow visitor-sans">{isEnglish ? "Once a day" : "Günde bir kez"}</span>
      <h2 id={headingId} className="feed-newsletter-headline visitor-sans">{isEnglish ? "The briefing, in your inbox." : "Gündem e-postanızda."}</h2>
      <p className="feed-newsletter-lead">{isEnglish
        ? "Short notes on technology, AI, science and digital culture, once a day. Free, and you can leave any time."
        : "Teknoloji, yapay zekâ, bilim ve dijital kültürden kısa notlar, günde bir kez. Ücretsiz, istediğiniz an ayrılabilirsiniz."}</p>
      <div className="feed-newsletter-signup">
        <NewsletterForm language={language} inlineConfirmation={modal} />
        <p className="visitor-newsletter-terms visitor-sans">{isEnglish ? "Your address is only for the newsletter." : "Adresiniz yalnızca bülten için kullanılır."}</p>
      </div>
    </section>
  );
}
