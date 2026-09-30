import { NewsletterLink } from "./newsletter-modal";
import { ArrowRight } from "lucide-react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The newsletter, offered once at the end of the feed rather than between the notes.
 *
 * A link rather than a field: the sign-up has a page of its own with one input on it.
 */
export function NewsletterPromo({ language }: { language: VisitorLanguage }) {
  const isEnglish = language === "en";
  return (
    <NewsletterLink href={languageHref("/ebulten", language)} className="feed-newsletter visitor-sans group">
      <span className="feed-newsletter-title">{isEnglish ? "Get the daily notes by email." : "Günün notları e-postanıza gelsin."}</span>
      <span className="feed-newsletter-body">{isEnglish
        ? "Once a day, free, and you can leave any time."
        : "Günde bir kez, ücretsiz, istediğiniz an ayrılabilirsiniz."}</span>
      <span className="feed-newsletter-cta">{isEnglish ? "Subscribe" : "Kaydol"}<ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></span>
    </NewsletterLink>
  );
}
