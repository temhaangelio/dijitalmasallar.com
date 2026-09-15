import { ListenLink } from "./listen-modal";
import { ArrowRight, Play } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/** The feed opens the selected bulletin in the dedicated listening room. */
export function DailyAudioPlayer({ day, durationSeconds, language, title }: {
  title?: string;
  day: string;
  durationSeconds: number;
  language: VisitorLanguage;
}) {
  const english = language === "en";
  const seconds = Math.max(0, Math.floor(durationSeconds));
  const date = fullDateLabel(`${day}T12:00:00+03:00`, language);
  return (
    <ListenLink href={`${languageHref("/podcast", language, { day, play: 1 })}#oynatici`} className="visitor-card feed-audio-link visitor-sans" aria-label={english ? `Listen to the ${date} briefing` : `${date} bültenini dinle`}>
      <span className="feed-audio-play" aria-hidden="true"><Play size={19} fill="currentColor" strokeWidth={1.5} /></span>
      <div className="feed-audio-copy"><p>{title ?? (english ? "Daily briefing" : "Günün bülteni")}</p><span className="feed-audio-duration">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} <span aria-hidden="true">·</span> {english ? "English" : "Türkçe"}</span></div>
      <span className="feed-audio-action">{english ? "Listen" : "Dinle"}<ArrowRight size={15} aria-hidden="true" /></span>
    </ListenLink>
  );
}
