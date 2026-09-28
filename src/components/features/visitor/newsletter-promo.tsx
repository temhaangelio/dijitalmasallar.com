import { NewsletterLink } from "./newsletter-modal";
import { ArrowRight } from "lucide-react";
import { NewsletterEnvelope } from "./newsletter-content";
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
  // Laid out like the podcast card: dateline, headline, a 16:9 picture, then a line of body text.
  return (
    <div className="visitor-ad-slot xl:flex xl:flex-col">
      <NewsletterLink href={languageHref("/ebulten", language)} className="visitor-card visitor-note-card feed-audio-card group">
        <span className="visitor-note-content block min-w-0 flex-1 px-5 py-5 sm:px-6 sm:py-6 xl:px-5 xl:py-5">
          <span className="visitor-note-time visitor-sans"><span>{isEnglish ? "Suggested" : "Öneri"}</span><span className="ml-auto shrink-0">{isEnglish ? "Newsletter" : "E-bülten"}</span></span>
          <span className="visitor-note-initial feed-audio-card-title visitor-copy block font-semibold text-ink [text-wrap:pretty]">{isEnglish ? "The daily technology briefing, in your inbox." : "Günlük teknoloji özeti e-postanızda."}</span>
          <span className="audio-art-stage newsletter-promo-stage visitor-note-cover relative mt-5 block aspect-video w-full overflow-hidden rounded-[10px]" aria-hidden="true">
            <NewsletterEnvelope language={language} />
          </span>
          <span className="visitor-note-body feed-audio-card-body visitor-copy mt-5 block text-ink [text-wrap:pretty] xl:mt-3">{isEnglish
            ? "The day's technology, science, AI and digital culture notes, once a day in your inbox. Free, and you can leave any time."
            : "Günün teknoloji, bilim, yapay zekâ ve dijital kültür notları, günde bir kez e-postanızda. Ücretsiz, istediğiniz an ayrılabilirsiniz."}</span>
          <span className="visitor-promo-cta visitor-sans">{isEnglish ? "Subscribe to the newsletter" : "E-bültene kaydolun"}<ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></span>
        </span>
      </NewsletterLink>
    </div>
  );
}
