import { ListenLink } from "./listen-modal";
import { Play } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The day's bulletin as one line under the day's heading: a play mark, what it is, how long. It
 * opens the listening room like the card did, without taking a note's worth of the column.
 */
export function DailyAudioRow({ day, durationSeconds, language, title }: {
  title: string;
  day: string;
  durationSeconds: number;
  language: VisitorLanguage;
}) {
  const english = language === "en";
  const seconds = Math.max(0, Math.floor(durationSeconds));
  const at = new Date(`${day}T12:00:00+03:00`);
  const date = fullDateLabel(at.toISOString(), language);
  const minutes = Math.max(1, Math.round(seconds / 60));
  return (
    <ListenLink href={`${languageHref("/podcast", language, { day, play: 1 })}#oynatici`} className="feed-audio-row visitor-sans" aria-label={english ? `Listen to the ${date} briefing` : `${date} bültenini dinle`}>
      <span className="feed-audio-row-play" aria-hidden="true"><Play size={13} fill="currentColor" strokeWidth={0} /></span>
      <span className="feed-audio-row-title">{title}</span>
      <span className="feed-audio-row-meta tabular-nums">{minutes} {english ? "min" : "dk"}</span>
    </ListenLink>
  );
}
