"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ListMusic, LoaderCircle, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import type { VisitorLanguage } from "@/lib/visitor-language";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/action-menu";
import { BrandDigit } from "@/components/ui/brand-mark";

export type PlaylistItem = { day: string; audioUrl: string; durationSeconds: number; excerpt: string };
const clock = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, "0")}`;

export function AudioPlaylist({ items, language, initialDay, autoPlay = false }: { items: PlaylistItem[]; language: VisitorLanguage; initialDay?: string; autoPlay?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const initialIndex = Math.max(0, items.findIndex(item => item.day === initialDay));
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(items[initialIndex]?.durationSeconds ?? 0);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoPlay) return;
    const token = ++request.current;
    let disposed = false;
    void audio.play().catch((reason: unknown) => {
      if (disposed || token !== request.current) return;
      setWaiting(false);
      if (reason instanceof Error && reason.name === "NotAllowedError") setAutoplayBlocked(true);
      else if (!(reason instanceof Error && reason.name === "AbortError")) setError(true);
    });
    return () => { disposed = true; audio.pause(); };
  }, [autoPlay]);
  const english = language === "en";
  const active = items[index];
  const total = items.reduce((sum, item) => sum + item.durationSeconds, 0);
  const date = (day: string) => fullDateLabel(`${day}T12:00:00+03:00`, language);

  async function play(next = index, restart = false) {
    const audio = audioRef.current;
    if (!audio || !items[next]) return;
    const token = ++request.current;
    setError(false); setAutoplayBlocked(false); setWaiting(true);
    if (next !== index || restart) {
      audio.pause();
      audio.src = items[next].audioUrl;
      audio.load();
      setIndex(next); setCurrent(0); setDuration(items[next].durationSeconds);
    }
    audio.playbackRate = speed;
    try { await audio.play(); }
    catch { if (token === request.current) { setError(true); setWaiting(false); setPlaying(false); } }
  }
  function pause() {
    request.current++;
    audioRef.current?.pause();
    setPlaying(false); setWaiting(false);
  }
  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    setCurrent(audio.currentTime);
  }
  if (!active) return null;
  return (
    <div id="oynatici" className="visitor-card listen-studio scroll-mt-4" data-playing={playing && !waiting || undefined}>
      <section className="listen-console" aria-label={english ? "Audio player" : "Ses oynatıcı"} data-playing={playing && !waiting || undefined}>
        <div className="listen-now">
          <div className="listen-cover">
            <div className="listen-cover-binary" aria-hidden="true">
              {[
                { digit: "0", x: 8, y: 23, size: 5, opacity: .12 },
                { digit: "1", x: 24, y: 18, size: 3, opacity: .08 },
                { digit: "1", x: 18, y: 34, size: 8, opacity: .09 },
                { digit: "0", x: 36, y: 27, size: 4, opacity: .13 },
                { digit: "0", x: 5, y: 43, size: 3, opacity: .07 },
                { digit: "1", x: 47, y: 13, size: 2.5, opacity: .08 },
              ].map((bit, i) => <span key={i} style={{
                left: `${bit.x}%`, top: `${bit.y}%`, width: `${bit.size}%`, opacity: bit.opacity,
              }}><BrandDigit value={bit.digit} /></span>)}
            </div>
            <div className="listen-cover-top"><span>Dijital Masallar</span><span>{english ? "EN" : "TR"} / AUDIO</span></div>
            <div className="listen-cover-record"><span /></div>
            <div className="listen-tonearm-base" />
            <div className="listen-tonearm">
              <span className="listen-tonearm-weight" />
              <span className="listen-tonearm-shaft" />
              <span className="listen-tonearm-cartridge" />
            </div>
            <div className="listen-cover-bottom"><strong>{english ? "Daily\nbriefing." : "Günün\nBülteni"}</strong><span>{date(active.day)}</span></div>
            <div className="listen-speed">
              <ActionMenu
                label={`${english ? "Playback speed" : "Oynatma hızı"}: ${speed}×`}
                trigger={<><span>{speed}×</span><ChevronDown size={10} aria-hidden="true" /></>}
                triggerClassName="listen-speed-trigger"
                placement="inline-above"
                items={[.75, 1, 1.25, 1.5, 2].map(value => ({
                  label: value === 1 ? "1× · Normal" : `${value}×`,
                  checked: speed === value,
                  onSelect: () => { setSpeed(value); if (audioRef.current) audioRef.current.playbackRate = value; },
                }))}
              />
            </div>
          </div>
          <span className="sr-only" aria-live="polite">{date(active.day)}</span>
        </div>
        <div className="visitor-daily-audio-track listen-timeline">
          <span className="visitor-daily-audio-time tabular-nums">{clock(current)}</span>
          <input className="visitor-audio-seek" type="range" min={0} max={duration || 1} step={.1} value={Math.min(current, duration || 0)} aria-label={english ? "Playback position" : "Oynatma konumu"} aria-valuetext={`${clock(current)} / ${clock(duration)}`} onChange={event => { const audio = audioRef.current; if (audio && Number.isFinite(audio.duration)) { audio.currentTime = Number(event.target.value); setCurrent(audio.currentTime); } }} style={{ background: `linear-gradient(to right, var(--color-accent) ${duration ? current / duration * 100 : 0}%, var(--color-line) 0%)` }} />
          <span className="visitor-daily-audio-time tabular-nums">{clock(duration)}</span>
        </div>
        <div className="listen-transport">
          <Button variant="ghost" className="w-11 px-0" disabled={index === 0} aria-label={english ? "Previous recording" : "Önceki kayıt"} onClick={() => void play(index - 1)}><SkipBack size={20} /></Button>
          <Button variant="ghost" className="listen-skip" aria-label={english ? "Back 10 seconds" : "10 saniye geri"} onClick={() => skip(-10)}><RotateCcw size={24} aria-hidden="true" /><span>10</span></Button>
          <Button className="!size-16 !min-h-16 !p-0" aria-label={playing || waiting ? (english ? "Pause" : "Duraklat") : (english ? "Play" : "Dinle")} onClick={() => playing || waiting ? pause() : void play()}>{waiting ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : playing ? <Pause size={25} /> : <Play size={25} />}</Button>
          <Button variant="ghost" className="listen-skip" aria-label={english ? "Forward 10 seconds" : "10 saniye ileri"} onClick={() => skip(10)}><RotateCw size={24} aria-hidden="true" /><span>10</span></Button>
          <Button variant="ghost" className="w-11 px-0" disabled={index === items.length - 1} aria-label={english ? "Next recording" : "Sonraki kayıt"} onClick={() => void play(index + 1)}><SkipForward size={20} /></Button>
        </div>
        {autoplayBlocked ? <p role="status" className="mt-3 text-center text-xs text-muted">{english ? "Press play to start listening." : "Dinlemeye başlamak için oynat düğmesine dokunun."}</p> : null}
        {error ? <p role="alert" className="mt-3 text-center text-sm text-danger">{english ? "Playback failed. Try again or select the next recording." : "Ses oynatılamadı. Yeniden deneyin veya sonraki kaydı seçin."}</p> : null}
        <audio ref={audioRef} src={items[initialIndex].audioUrl} preload={autoPlay ? "auto" : "none"} onTimeUpdate={event => setCurrent(event.currentTarget.currentTime)} onLoadedMetadata={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration); }} onPlay={() => { setPlaying(true); setAutoplayBlocked(false); }} onPlaying={() => setWaiting(false)} onWaiting={() => setWaiting(true)} onPause={() => setPlaying(false)} onError={() => { setError(true); setWaiting(false); setPlaying(false); }} onEnded={() => { setPlaying(false); setWaiting(false); if (index + 1 < items.length) void play(index + 1); else setCurrent(duration); }} />
      </section>
      <section className="listen-queue" aria-label={english ? "Playback queue" : "Dinleme sırası"}>
        <div className="listen-queue-heading"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><ListMusic size={18} />{english ? "All recordings" : "Tüm kayıtlar"}</h2><p className="mt-1 text-xs text-muted">{items.length} {english ? "recordings" : "kayıt"} · {clock(total)}</p></div><Button size="sm" variant="secondary" onClick={() => void play(0, true)}><Play size={14} />{english ? "Play all" : "Tümünü dinle"}</Button></div>
        <ol className="listen-queue-list">{items.map((item, i) => <li key={item.day}><button className="listen-queue-item" aria-current={i === index ? "true" : undefined} onClick={() => i === index && playing ? pause() : void play(i)}><span className="listen-queue-number">{i === index && playing ? <span className="visitor-audio-wave" aria-hidden="true"><span style={{ height: 16 }} /><span style={{ height: 24 }} /><span style={{ height: 12 }} /></span> : String(i + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{date(item.day)}</span><span className="mt-1 block truncate text-xs text-muted" title={item.excerpt}>{item.excerpt}</span></span><span className="text-xs tabular-nums text-muted">{clock(item.durationSeconds)}</span>{i === index && playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}</button></li>)}</ol>
      </section>
    </div>
  );
}
