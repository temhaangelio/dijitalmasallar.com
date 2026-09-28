import { ArrowRight, Headphones } from "lucide-react";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { ListenLink } from "./listen-modal";

export function ListenPromo({ language }: { language: VisitorLanguage }) {
  const english = language === "en";
  return (
    <div className="visitor-ad-slot xl:flex xl:flex-col">
      <ListenLink href={languageHref("/podcast", language)} className="visitor-card visitor-promo-card visitor-sans group">
        <span className="visitor-note-time"><span>{english ? "Suggested" : "Öneri"}</span></span>
        <span className="visitor-promo-title">{english ? "Give your eyes a break. Listen to the daily briefing." : "Gözlerinize bir mola, günün bültenine kulak verin."}</span>
        <span className="visitor-promo-stage" aria-hidden="true"><Headphones strokeWidth={1.5} /></span>
        <span className="visitor-promo-cta">
          {english ? "Listen to the bulletins" : "Bültenleri dinleyin"}
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </span>
      </ListenLink>
    </div>
  );
}
