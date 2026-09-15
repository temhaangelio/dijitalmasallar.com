"use client";

import { useId } from "react";
import { BrandDigit } from "@/components/ui/brand-mark";
import { NewsletterForm } from "./newsletter-form";
import type { VisitorLanguage } from "@/lib/visitor-language";

export function NewsletterContent({ language, modal = false }: { language: VisitorLanguage; modal?: boolean }) {
  const isEnglish = language === "en";
  const headingId = useId();
  return (
    <div className="visitor-card visitor-newsletter-card newsletter-letter-layout">
      <section className="visitor-newsletter-main" aria-labelledby={headingId}>
        <div className="newsletter-art-panel" aria-hidden="true">
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
        </div>
        <div className="newsletter-details">
          <h2 id={headingId} className="visitor-newsletter-headline visitor-sans">{isEnglish ? "The briefing, in your inbox." : "Gündem e-postanızda."}</h2>
          <p className="visitor-newsletter-lead visitor-sans">{isEnglish
            ? "Short notes on technology, AI, science and digital culture."
            : "Teknoloji, yapay zekâ, bilim ve dijital kültürden kısa notlar."}</p>
          <div className="visitor-newsletter-signup">
            <NewsletterForm language={language} inlineConfirmation={modal} />
            <p className="visitor-newsletter-terms visitor-sans">{isEnglish ? "Your address is only for the newsletter." : "Adresiniz yalnızca bülten için kullanılır."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
