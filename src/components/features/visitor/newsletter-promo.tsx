import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The newsletter, offered inside the feed the way an ad is.
 *
 * It borrows the ad slot's place in the column and nothing else: no image, no body copy, one line
 * and a way in. A reader scrolling past a wall of notes should be able to take it in without
 * stopping, and a suggestion that costs a screenful of reading is an interruption, not a
 * suggestion.
 *
 * A link rather than a field. The sign-up already has a page of its own with one input on it, and
 * dropping a live form into the feed several times over would mean several forms racing to be the
 * one that confirms. This says what arrives and takes the reader there.
 */
export function NewsletterPromo({ language }: { language: VisitorLanguage }) {
  const isEnglish = language === "en";
  return (
    <div className="visitor-ad-slot xl:col-span-full">
      <Link href={languageHref("/ebulten", language)} className="visitor-card visitor-newsletter-promo visitor-sans group">
        <span className="visitor-newsletter-promo-mark" aria-hidden="true"><Mail size={19} strokeWidth={1.7} /></span>
        <span className="visitor-newsletter-promo-body">
          <span className="visitor-newsletter-promo-label">{isEnglish ? "Suggested" : "Öneri"}</span>
          <span className="visitor-newsletter-promo-title">{isEnglish
            ? "The daily technology briefing, in your inbox."
            : "Günlük teknoloji özeti e-postanızda."}</span>
          <span className="visitor-newsletter-promo-cta">
            {isEnglish ? "Subscribe to the newsletter" : "E-bültene kaydolun"}
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        </span>
      </Link>
    </div>
  );
}
