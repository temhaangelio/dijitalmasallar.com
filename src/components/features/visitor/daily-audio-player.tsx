import { ListenLink } from "./listen-modal";
import { useId } from "react";
import { Play } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The stage's backdrop: the four subjects the notes cover, drawn as fine line motifs over a soft wash —
 * circuit traces (technology), an atom (science), a small neural network (AI), and pixels with a
 * chat bubble (digital culture). Decorative only, shared with the listen suggestion card, and never takes a tap.
 */
export function AudioStageArt() {
  const id = useId();
  // A tile at its natural size, repeated: every stage, tall or wide, shows the motifs at one scale
  // instead of stretching or cropping a single drawing.
  return (
    <svg className="feed-audio-card-art" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="480" height="300" x="-40" y="-20" patternUnits="userSpaceOnUse" patternTransform="scale(.72)">
            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <g opacity=".55">
                <path d="M18 250h70l20-20h46" /><path d="M18 272h96l14 14" /><path d="M60 228v-34l18-18h40" />
                <circle cx="154" cy="230" r="4" /><circle cx="118" cy="176" r="4" /><circle cx="128" cy="286" r="3" />
              </g>
              <g opacity=".6" transform="translate(392 70)">
                <ellipse rx="44" ry="16" /><ellipse rx="44" ry="16" transform="rotate(60)" /><ellipse rx="44" ry="16" transform="rotate(-60)" />
                <circle r="5" fill="currentColor" stroke="none" />
              </g>
              <g opacity=".55">
                <path d="M300 214l46-26M300 214l46 14M300 214l46 50M346 188l52 20M346 228l52-20M346 264l52-18M346 188l52 58M346 264l52-56" />
                <circle cx="300" cy="214" r="6" fill="var(--art-node)" /><circle cx="346" cy="188" r="6" fill="var(--art-node)" /><circle cx="346" cy="228" r="6" fill="var(--art-node)" />
                <circle cx="346" cy="264" r="6" fill="var(--art-node)" /><circle cx="398" cy="208" r="6" fill="var(--art-node)" /><circle cx="398" cy="246" r="6" fill="var(--art-node)" />
              </g>
              <g opacity=".5">
                <path d="M200 36h66a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10h-40l-14 12v-12h-12a10 10 0 0 1-10-10V46a10 10 0 0 1 10-10Z" />
                <path d="M212 60h40M212 70h24" />
              </g>
            </g>
            <g fill="currentColor" opacity=".22">
              <rect x="28" y="34" width="10" height="10" rx="2" /><rect x="42" y="34" width="10" height="10" rx="2" /><rect x="42" y="48" width="10" height="10" rx="2" />
              <rect x="56" y="48" width="10" height="10" rx="2" /><rect x="28" y="62" width="10" height="10" rx="2" />
              <rect x="440" y="252" width="8" height="8" rx="2" /><rect x="452" y="252" width="8" height="8" rx="2" /><rect x="452" y="264" width="8" height="8" rx="2" />
            </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * The day's bulletin as a note-sized card that takes a place in the feed's grid among the notes,
 * opening it in the listening room: the note's dateline (what it is, how long),  a headline, and one large play control.
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
        <AudioStageArt />
        <span className="feed-audio-play" aria-hidden="true"><Play size={26} fill="currentColor" strokeWidth={1.5} /></span>
      </span>
    </ListenLink>
  );
}
