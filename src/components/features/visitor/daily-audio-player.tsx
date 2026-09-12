"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import type { VisitorLanguage } from "@/lib/visitor-language";

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * The day's summary, read aloud, at the head of the feed.
 *
 * A custom transport rather than `<audio controls>`: the browser's own bar is a grey slab that
 * belongs to no design, and this row has to sit above the notes without shouting over the first
 * one. The element itself is still an `<audio>` — it just has no chrome — so the platform keeps
 * doing the buffering, the media keys and the lock screen.
 *
 * Nothing is fetched until it is played: `preload="none"` means a reader who scrolls past costs
 * nothing, which is the whole reason this is safe to put at the top of every visit.
 */
export function DailyAudioPlayer({ src, day, durationSeconds, language }: {
  src: string;
  day: string;
  durationSeconds: number;
  language: VisitorLanguage;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(durationSeconds);
  const isEnglish = language === "en";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => { if (Number.isFinite(audio.duration)) setTotal(audio.duration); };
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    const onPlay = () => { setPlaying(true); setWaiting(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { setWaiting(true); void audio.play().catch(() => setWaiting(false)); }
    else audio.pause();
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const box = event.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * total;
    setCurrent(audio.currentTime);
  }

  const progress = total ? Math.min(100, (current / total) * 100) : 0;
  const label = isEnglish ? "Daily briefing" : "Günün özeti";

  return (
    <section className="visitor-card visitor-daily-audio visitor-sans" aria-label={label}>
      <button
        type="button"
        onClick={toggle}
        className="visitor-daily-audio-button"
        aria-label={playing ? (isEnglish ? "Pause" : "Duraklat") : (isEnglish ? "Play the daily briefing" : "Günün özetini çal")}
      >
        {waiting ? <LoaderCircle size={20} strokeWidth={2} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          : playing ? <Pause size={20} strokeWidth={2} aria-hidden="true" />
          : <Play size={20} strokeWidth={2} aria-hidden="true" />}
      </button>

      <div className="visitor-daily-audio-body">
        <p className="visitor-daily-audio-title">{label}</p>
        <time dateTime={day} className="visitor-daily-audio-date">{fullDateLabel(`${day}T12:00:00+03:00`, language)}</time>
      </div>

      <div className="visitor-daily-audio-track">
        {/* A bar rather than a range input: it is a one-minute clip, so the only gesture worth
            supporting is landing somewhere in it. */}
        <div className="visitor-daily-audio-bar" onClick={seek} role="presentation">
          <span style={{ width: `${progress}%` }} />
        </div>
        {/* Idle it says how long the clip is; playing it says where you are in it. Elapsed alone read
            as a stuck "0:00" for the first second. */}
        <span className="visitor-daily-audio-time tabular-nums">{playing || current ? `${clock(current)} / ${clock(total)}` : clock(total)}</span>
      </div>

      <audio ref={audioRef} src={src} preload="none" />
    </section>
  );
}
