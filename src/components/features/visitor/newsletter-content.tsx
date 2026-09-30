"use client";

import { useId } from "react";
import { BrandDigit } from "@/components/ui/brand-mark";
import { NewsletterForm } from "./newsletter-form";
import type { VisitorLanguage } from "@/lib/visitor-language";

export function NewsletterContent({ language, modal = false }: { language: VisitorLanguage; modal?: boolean }) {
  const isEnglish = language === "en";
  const headingId = useId();
  return (
    <section className="feed-newsletter-page" aria-labelledby={headingId}>
      <div className="feed-newsletter-art" aria-hidden="true">
        <NewsletterEnvelope language={language} />
      </div>
      <h2 id={headingId} className="feed-newsletter-headline visitor-sans">{isEnglish ? "The briefing, in your inbox." : "Gündem e-postanızda."}</h2>
      <p className="feed-newsletter-lead visitor-sans">{isEnglish
        ? "Short notes on technology, AI, science and digital culture, once a day. Free, and you can leave any time."
        : "Teknoloji, yapay zekâ, bilim ve dijital kültürden kısa notlar, günde bir kez. Ücretsiz, istediğiniz an ayrılabilirsiniz."}</p>
      <div className="feed-newsletter-signup">
        <NewsletterForm language={language} inlineConfirmation={modal} />
        <p className="visitor-newsletter-terms visitor-sans">{isEnglish ? "Your address is only for the newsletter." : "Adresiniz yalnızca bülten için kullanılır."}</p>
      </div>
    </section>
  );
}

/** The sealed envelope with the day's letter in it — the newsletter's picture, here and in the feed's suggestion card. */
export function NewsletterEnvelope({ language }: { language: VisitorLanguage }) {
  const isEnglish = language === "en";
  return (
    <div className="newsletter-letter-cover">
      <div className="newsletter-envelope">
        <div className="newsletter-envelope-back" />
        <div className="newsletter-paper">
          <span className="newsletter-paper-brand">Dijital Masallar</span>
          <strong>{isEnglish ? "A little\nfrom the day." : "Her Gün\nGündemden\nKısa Notlar"}</strong>
          <span className="newsletter-paper-lines" />
        </div>
        <div className="newsletter-envelope-front" />
        <span className="newsletter-envelope-seal"><span className="newsletter-seal-monogram"><BrandDigit value="0" /><BrandDigit value="1" /><BrandDigit value="1" /><BrandDigit value="0" /></span></span>
      </div>
    </div>
  );
}
