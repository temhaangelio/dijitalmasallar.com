import { NewsletterLink } from "./newsletter-modal";
import { ArrowRight, Mail } from "lucide-react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The newsletter, offered inside the feed the way an ad is.
 *
 * A card among the notes, one grid cell like theirs: the note's dateline ("Öneri"), a one-line
 * headline, a quiet stage with the mark, and a way in. No body copy — it should be taken in without
 * stopping.
 *
 * A link rather than a field. The sign-up already has a page of its own with one input on it, and
 * dropping a live form into the feed several times over would mean several forms racing to be the
 * one that confirms. This says what arrives and takes the reader there.
 */
export function NewsletterPromo({ language }: { language: VisitorLanguage }) {
  const isEnglish = language === "en";
  return (
    <div className="visitor-ad-slot xl:flex xl:flex-col">
      <NewsletterLink href={languageHref("/ebulten", language)} className="visitor-card visitor-promo-card visitor-sans group">
        <span className="visitor-note-time"><span>{isEnglish ? "Suggested" : "Öneri"}</span></span>
        <span className="visitor-promo-title">{isEnglish
            ? "The daily technology briefing, in your inbox."
            : "Günlük teknoloji özeti e-postanızda."}</span>
        <span className="visitor-promo-stage" aria-hidden="true"><Mail strokeWidth={1.5} /></span>
        <span className="visitor-promo-cta">
          {isEnglish ? "Subscribe to the newsletter" : "E-bültene kaydolun"}
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </span>
      </NewsletterLink>
    </div>
  );
}
