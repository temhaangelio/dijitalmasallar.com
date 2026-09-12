"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioLines, Check, ChevronDown, ChevronRight, Copy, Download, Globe, LoaderCircle, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { createDaySpeechAction, deleteRecordingAction, loadDayPostsAction, publishRecordingAction, unpublishDayAudioAction } from "@/app/(dashboard)/gunun-ozeti/actions";
import { EmptyState } from "@/components/feedback/states";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/toast";
import { postPlainText } from "@/lib/post-content";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import type { Recording } from "@/services/speech";
import type { Post } from "@/types/database";

type Loaded = { day: string; posts: Post[]; scheduled: Post[]; recordings: Recording[]; published: boolean };

/** When a take was made, for the line above its player. */
const takeTime = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

/**
 * The day's notes as one piece of continuous prose.
 *
 * Each note becomes a single paragraph and the paragraphs follow one another — the day told, not
 * indexed: no numbering, no bullets, no timestamps and no addresses. A note's own paragraph breaks
 * are flattened into the sentence flow, because a story that arrives as three short blocks reads as
 * three items rather than as one account.
 */
export function composeSummary(posts: Post[], heading: string) {
  const paragraphs = posts.map((post) => {
    // The opening `# heading` is where the note's own title comes from, so in the prose it would
    // arrive twice — once as a stray fragment and again as the sentence that follows it.
    const body = post.body.replace(/^#\s+[^\n]+\n+/i, "");
    return (postPlainText(body) || post.excerpt).replace(/\n{2,}/g, " ").replace(/\s{2,}/g, " ").trim();
  });
  return [heading, "", paragraphs.join("\n\n")].join("\n");
}

/**
 * The days that have notes, as a list.
 *
 * A day opens in a dialog rather than on a page of its own: the summary is something you copy and
 * leave, not somewhere you navigate to — and from a list the next day is one click away instead of
 * two. The list itself carries nothing but the dates; a day's text is fetched when it is opened.
 */
export function DaySummaryList({ days, language, speech, recorded, published }: { days: string[]; language: "tr" | "en"; speech: boolean; recorded: string[]; published: string[] }) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  /* The request is the effect's only job; the failure flag is cleared where the day is chosen, so
     nothing here writes state before the answer comes back. */
  useEffect(() => {
    if (!openDay) return;
    let ignore = false;
    loadDayPostsAction(openDay, language)
      .then((result) => {
        if (ignore) return;
        if (!result.success) { setFailed(true); return; }
        setLoaded({ day: openDay, posts: result.posts, scheduled: result.scheduled, recordings: result.recordings, published: result.published });
      })
      .catch(() => { if (!ignore) setFailed(true); });
    return () => { ignore = true; };
  }, [openDay, language]);

  function close() {
    setOpenDay(null);
    setLoaded(null);
    setFailed(false);
  }

  if (!days.length) {
    return (
      <div className="card">
        <EmptyState title="Henüz özetlenecek gün yok" description="Not yayımlandıkça günler burada listelenir." />
      </div>
    );
  }

  const ready = loaded && loaded.day === openDay ? loaded : null;
  const dayLabel = (day: string) => fullDateLabel(`${day}T12:00:00+03:00`, language);
  const hasTake = new Set(recorded);
  const isLive = new Set(published);

  return (
    <>
      <section className="card overflow-hidden !p-0" aria-label="Günler">
        <ul>
          {days.map((day) => (
            <li key={day}>
              <button
                type="button"
                onClick={() => { setFailed(false); setLoaded(null); setOpenDay(day); }}
                className="flex min-h-14 w-full items-center gap-4 border-b border-line px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors last:border-b-0 hover:bg-surface-2/60 sm:px-5"
              >
                <span className="min-w-0 flex-1 truncate">{dayLabel(day)}</span>
                {/* One mark, two meanings: a take exists here, or that take is on the site. */}
                {isLive.has(day) ? (
                  <span title="Ses kaydı sitede yayında" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-surface px-2.5 py-1 text-[11px] font-semibold text-success">
                    <AudioLines className="size-3.5" strokeWidth={2} aria-hidden="true" />Yayında
                  </span>
                ) : hasTake.has(day) ? (
                  <AudioLines className="size-[18px] shrink-0 text-muted" strokeWidth={1.8} aria-label="Ses kaydı var" />
                ) : null}
                <ChevronRight className="size-5 shrink-0 text-faint" strokeWidth={1.7} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {openDay ? (
        <AppDialog title={dayLabel(openDay)} headline={dayLabel(openDay)} onClose={close} hideIdentity panelClassName="!max-w-[860px] !bg-canvas">
          <DayDialogBody heading={`${dayLabel(openDay)} · Günün özeti`} day={openDay} language={language} loaded={ready} failed={failed} speech={speech} />
        </AppDialog>
      ) : null}
    </>
  );
}

function DayDialogBody({ heading, day, language, loaded, failed, speech }: { heading: string; day: string; language: "tr" | "en"; loaded: Loaded | null; failed: boolean; speech: boolean }) {
  const [copied, setCopied] = useState(false);
  // The text box opens short; reaching for it is what makes it tall.
  const [expanded, setExpanded] = useState(false);
  const posts = loaded?.posts ?? [];

  /*
   * The text is derived from the notes and the switches, not stored — an edit is the exception, so
   * only the edit is held. Composing during render rather than in an effect means the box is never
   * briefly stale, and changing day or language rebuilds it.
   */
  const composed = composeSummary(posts, heading);
  const [draft, setDraft] = useState<string | null>(null);
  const [composedAtEdit, setComposedAtEdit] = useState(composed);
  if (composed !== composedAtEdit) {
    setComposedAtEdit(composed);
    setDraft(null);
  }
  const text = draft ?? composed;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Özet panoya kopyalandı.", "success");
    } catch {
      showToast("Kopyalanamadı. Metni seçip elle kopyalayabilirsiniz.", "error");
    }
  }

  if (failed) {
    return <p role="alert" className="mt-5 rounded-field bg-danger-surface p-4 text-sm text-danger">Günün notları alınamadı. Pencereyi kapatıp tekrar deneyin.</p>;
  }

  if (!loaded) {
    return (
      <p role="status" className="mt-6 flex min-h-40 items-center justify-center gap-2 text-sm text-muted">
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Notlar yükleniyor…
      </p>
    );
  }

  if (!posts.length && !loaded.scheduled.length) {
    return <div className="mt-5"><EmptyState title="Bu güne ait yazı yok" description="Seçili günde yayımlanmış bir not bulunmuyor." /></div>;
  }

  return (
    <div className="mt-5 space-y-5">
      {posts.length ? (
        <>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="day-summary-text" className="text-sm font-semibold">Kopyalanacak metin</label>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)} title="Notlardan yeniden oluştur">
                  <RotateCcw className="size-4" aria-hidden="true" />Yeniden oluştur
                </Button>
                <Button type="button" size="sm" onClick={() => void copy()}>
                  {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </Button>
              </div>
            </div>
            {/*
              * The box opens at four lines and grows when it is reached for. A day of notes fills
              * sixteen lines, and at that height it is the whole dialog — while most visits are
              * here to press Kopyala and leave. Focus counts as reaching for it, so clicking into
              * the text to edit expands it without a second step, and it stays open until it is
              * folded back.
              */}
            <div className="relative">
              <textarea
                id="day-summary-text"
                value={text}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={() => setExpanded(true)}
                spellCheck={false}
                rows={expanded ? 16 : 4}
                className={`w-full rounded-field border border-line bg-surface p-4 font-[family-name:var(--font-visitor-sans)] text-[15px] leading-7 text-ink transition-colors focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink ${expanded ? "resize-y" : "cursor-pointer resize-none"}`}
              />
              {!expanded ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="absolute inset-x-px bottom-px flex h-14 items-end justify-center rounded-b-field bg-gradient-to-t from-surface via-surface/90 to-transparent pb-2 text-[13px] font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  <span className="flex items-center gap-1.5">Metnin tamamını göster<ChevronDown className="size-4" aria-hidden="true" /></span>
                </button>
              ) : null}
            </div>
            {expanded ? (
              <div className="mt-2 flex justify-end">
                <button type="button" onClick={() => setExpanded(false)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-ink-2 transition-colors hover:text-ink">
                  Daralt<ChevronDown className="size-4 rotate-180" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>

          {speech ? <DaySpeech text={text} day={day} language={language} recordings={loaded.recordings} published={loaded.published} /> : null}
        </>
      ) : null}

      {loaded.scheduled.length ? (
        <div className="rounded-field border border-line bg-surface p-4">
          <strong className="block text-sm">Bu gün planlı</strong>
          <p className="mt-1 text-[13px] leading-6 text-muted">Henüz yayımlanmadıkları için özete girmediler.</p>
          <div className="mt-2 divide-y divide-line">
            {loaded.scheduled.map((post) => (
              <Link key={post.id} prefetch={false} href={`/yazilar/${post.id}/duzenle`} className="group flex gap-3 py-2.5">
                <time dateTime={post.created_at} className="w-12 shrink-0 text-[11px] tabular-nums text-muted">{timeLabel(post.created_at, language)}</time>
                <span className="line-clamp-2 min-w-0 flex-1 text-[14px] leading-snug text-ink group-hover:underline">{post.title || post.excerpt || "Başlıksız not"}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The summary read aloud, on this machine.
 *
 * Two local steps behind one button: the model on Ollama writes the spoken version, the system
 * voice says it. Both take a while — about forty seconds for the writing — so the button reports
 * which step it is on rather than spinning silently. The result arrives as an mp3 in the reply and
 * becomes a blob here, so nothing is written into the project to be cleaned up later.
 */
function DaySpeech({ text, day, language, recordings, published }: { text: string; day: string; language: "tr" | "en"; recordings: Recording[]; published: boolean }) {
  const router = useRouter();
  const [rewrite, setRewrite] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takes, setTakes] = useState(recordings);
  const [live, setLive] = useState(published);

  async function run(action: () => Promise<{ success: boolean; message: string; recordings: Recording[] }>) {
    setPending(true);
    setError(null);
    try {
      const reply = await action();
      if (!reply.success) { setError(reply.message); return; }
      setTakes(reply.recordings);
      // The marks in the list behind the dialog are server state; this is what refreshes them.
      router.refresh();
    } catch {
      setError("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  /** Publishing and withdrawing change what the site plays, not the list of takes. */
  async function changeLive(action: () => Promise<{ success: boolean; message: string; published: boolean }>) {
    setPending(true);
    setError(null);
    try {
      const reply = await action();
      if (!reply.success) { setError(reply.message); return; }
      setLive(reply.published);
      showToast(reply.message, "success");
      router.refresh();
    } catch {
      setError("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-field border border-line bg-surface p-4" aria-label="Ses kaydı">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <strong className="block text-sm">Ses kaydı</strong>
          <small className="mt-0.5 block text-muted">Yerel model metni yazar, yerel ses okur. Kayıtlar bu bilgisayarda saklanır.</small>
          {live ? <small className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-success-surface px-2 py-0.5 text-[11px] font-semibold text-success">Bu günün kaydı sitede yayında</small> : null}
        </div>
        <Button type="button" onClick={() => void run(() => createDaySpeechAction(day, text, rewrite))} disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <AudioLines className="size-4" aria-hidden="true" />}
          {pending ? "Hazırlanıyor…" : takes.length ? "Yeniden oluştur" : "Ses oluştur"}
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-3">
        <div className="min-w-0">
          <strong className="block text-sm">Yerel modelle yeniden yaz</strong>
          <small className="mt-0.5 block text-muted">Spiker ağzından, selamlama ve kapanışla. Kapalıyken metin olduğu gibi okunur.</small>
        </div>
        <Switch checked={rewrite} label="Yerel modelle yeniden yaz" disabled={pending} onCheckedChange={setRewrite} />
      </div>

      {pending ? <p role="status" className="mt-3 text-[13px] text-muted">{rewrite ? "Yerel model metni yazıyor; bu adım bir dakikaya kadar sürebilir." : "Ses üretiliyor…"}</p> : null}
      {error ? <p role="alert" className="mt-3 rounded-field bg-danger-surface p-3 text-sm text-danger">{error}</p> : null}

      {live ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-[13px] text-muted">Akışın başında bu günün kaydı çalıyor.</p>
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void changeLive(() => unpublishDayAudioAction(day, language))}>
            <Undo2 className="size-4" aria-hidden="true" />Yayından kaldır
          </Button>
        </div>
      ) : null}

      {takes.length ? (
        <ul className="mt-4 space-y-4 border-t border-line pt-4">
          {takes.map((take) => (
            <li key={take.id}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-muted">
                  <time dateTime={take.createdAt} className="tabular-nums">{takeTime.format(new Date(take.createdAt))}</time>
                  {" · "}{take.engine === "piper" ? "Piper" : "Sistem sesi"}
                  {" · "}{Math.round(take.bytes / 1024).toLocaleString("tr-TR")} KB
                </p>
                <div className="flex items-center gap-1">
                  <a href={`/gunun-ozeti/ses/${take.id}`} download={`gunun-ozeti-${take.day}.mp3`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Download className="size-4" aria-hidden="true" />İndir
                  </a>
                  <Button type="button" size="sm" disabled={pending} title="Bu kaydı sitede yayına al" onClick={() => void changeLive(() => publishRecordingAction(take.id, language))}>
                    <Globe className="size-4" aria-hidden="true" />Yayınla
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={pending} aria-label="Kaydı sil" title="Kaydı sil" onClick={() => void run(() => deleteRecordingAction(take.id, day))}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <audio controls preload="none" src={`/gunun-ozeti/ses/${take.id}`} className="w-full" aria-label="Günün özeti ses kaydı" />
              <details className="group mt-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                  Okunan metin
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <p className="mt-2 whitespace-pre-wrap rounded-field bg-surface-2 p-3 text-[14px] leading-7 text-ink-2">{take.script}</p>
              </details>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
