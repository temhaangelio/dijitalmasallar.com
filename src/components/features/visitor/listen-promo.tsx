import { ArrowRight, Headphones } from "lucide-react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { ListenLink } from "./listen-modal";

export function ListenPromo({ language }: { language: VisitorLanguage }) {
  const english = language === "en";
  return (
    <div className="visitor-ad-slot xl:col-span-full">
      <ListenLink href={languageHref("/podcast", language)} className="visitor-card visitor-newsletter-promo visitor-sans group">
        <span className="visitor-newsletter-promo-mark" aria-hidden="true"><Headphones size={19} strokeWidth={1.7} /></span>
        <span className="visitor-newsletter-promo-body">
          <span className="visitor-newsletter-promo-label">{english ? "Suggested" : "Öneri"}</span>
          <span className="visitor-newsletter-promo-title">{english ? "Give your eyes a break. Listen to the daily briefing." : "Gözlerinize bir mola, günün bültenine kulak verin."}</span>
          <span className="visitor-newsletter-promo-cta">
            {english ? "Listen to the bulletins" : "Bültenleri dinleyin"}
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        </span>
      </ListenLink>
    </div>
  );
}
