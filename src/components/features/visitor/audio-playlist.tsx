"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, ListMusic, LoaderCircle, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react";
import { fullDateLabel } from "@/lib/visitor-date";
import type { VisitorLanguage } from "@/lib/visitor-language";
import { Button } from "@/components/ui/button";

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
          <div className="listen-cover" aria-hidden="true"><Headphones size={38} strokeWidth={1.4} /></div>
          <div className="listen-current" aria-live="polite">
            <p className="listen-eyebrow">{english ? "Daily briefing" : "Günün bülteni"}</p>
            <h2>{date(active.day)}</h2>
            <p className="listen-position">{index + 1} / {items.length} · {english ? "Newest to oldest" : "En yeniden eskiye"}</p>
          </div>
        </div>
        <div className="listen-playback-status">
          <span>{waiting ? (english ? "Loading…" : "Yükleniyor…") : playing ? (english ? "Now playing" : "Şimdi çalıyor") : (english ? "Ready to listen" : "Dinlemeye hazır")}</span>
          <div className="visitor-audio-wave" aria-hidden="true">{[12, 22, 30, 18, 25, 34, 20, 28, 16, 24, 30, 18].map((height, i) => <span key={i} style={{ height, animationDelay: `${-i * .13}s`, animationDuration: `${.7 + i % 4 * .17}s` }} />)}</div>
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
        <label className="listen-speed">{english ? "Speed" : "Hız"}<select value={speed} className="min-h-11 rounded-lg bg-surface px-2 text-ink" onChange={event => { const value = Number(event.target.value); setSpeed(value); if (audioRef.current) audioRef.current.playbackRate = value; }}>{[.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
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
