import { ListenLink } from "./listen-modal";
import { ArrowRight, Play } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The day's bulletin as a note-sized card that takes a place in the feed's grid among the notes,
 * opening it in the listening room: the note's dateline (what it is, how long), a headline, and one large play control.
 */
export function DailyAudioCard({ day, durationSeconds, language, title }: {
  title: string;
  day: string;
  durationSeconds: number;
  language: VisitorLanguage;
}) {
  const english = language === "en";
  const seconds = Math.max(0, Math.floor(durationSeconds));
  const date = fullDateLabel(`${day}T12:00:00+03:00`, language);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <ListenLink href={`${languageHref("/podcast", language, { day, play: 1 })}#oynatici`} className="visitor-card feed-audio-card visitor-sans" aria-label={english ? `Listen to the ${date} briefing` : `${date} bültenini dinle`}>
      <span className="visitor-note-time">
        <span>{title}</span>
        <span className="ml-auto shrink-0 tabular-nums">{duration} <span aria-hidden="true">·</span> {english ? "English" : "Türkçe"}</span>
      </span>
      <span className="feed-audio-card-title">{english ? `The ${date} notes, read aloud.` : `${date} notları, sesli.`}</span>
      <span className="feed-audio-card-stage">
        <span className="feed-audio-play" aria-hidden="true"><Play size={26} fill="currentColor" strokeWidth={1.5} /></span>
        <span className="feed-audio-action">{english ? "Listen" : "Dinle"}<ArrowRight size={15} aria-hidden="true" /></span>
      </span>
    </ListenLink>
  );
}
