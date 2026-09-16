"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioLines, Clock3, ChevronDown, ChevronRight, Copy, Download, Globe, LoaderCircle, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { createDaySpeechAction, deleteRecordingAction, loadDayPostsAction, publishRecordingAction, unpublishDayAudioAction } from "@/app/(dashboard)/gunun-ozeti/actions";
import { EmptyState } from "@/components/feedback/states";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { postPlainText } from "@/lib/post-content";
import { fullDateLabel, timeLabel } from "@/lib/visitor-date";
import type { Recording } from "@/services/speech";
import { languagesNeedingRecording, runBilingualTasks, speechLanguages, type Bilingual, type SpeechLanguage } from "@/lib/speech/bilingual";
import { estimatedSpeechDuration } from "@/lib/speech/duration";
import { initialSpeechScript } from "@/lib/speech/script-text";
import { MAX_SPEECH_CHARS } from "@/lib/speech/options";
import type { Post } from "@/types/database";

type Loaded = { day: string; posts: Post[]; scheduled: Post[]; recordings: Recording[]; published: boolean; message: string };

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
export function DaySummaryList({ days, language, speech, recorded, published, geminiReady }: { days: string[]; language: "tr" | "en"; speech: boolean; recorded: string[]; published: string[]; geminiReady: boolean }) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<"tr" | "en", Loaded | null>>({ tr: null, en: null });
  const [failed, setFailed] = useState({ tr: false, en: false });

  /* The request is the effect's only job; the failure flag is cleared where the day is chosen, so
     nothing here writes state before the answer comes back. */
  useEffect(() => {
    if (!openDay) return;
    let ignore = false;
    void Promise.all((["tr", "en"] as const).map(async (value) => {
      try {
        const result = await loadDayPostsAction(openDay, value);
        if (ignore) return;
        if (!result.success) { setFailed(current => ({ ...current, [value]: true })); return; }
        setLoaded(current => ({ ...current, [value]: { day: openDay, posts: result.posts, scheduled: result.scheduled, recordings: result.recordings, published: result.published, message: result.message } }));
      } catch { if (!ignore) setFailed(current => ({ ...current, [value]: true })); }
    }));
    return () => { ignore = true; };
  }, [openDay]);

  function close() {
    setOpenDay(null);
    setLoaded({ tr: null, en: null });
    setFailed({ tr: false, en: false });
  }

  if (!days.length) {
    return (
      <div className="card">
        <EmptyState title="Henüz özetlenecek gün yok" description="Not yayımlandıkça günler burada listelenir." />
      </div>
    );
  }

  const dayLabel = (day: string) => fullDateLabel(`${day}T12:00:00+03:00`, language);
  const hasTake = new Set(recorded);
  const isLive = new Set(published);

  return (
    <>
      <section className="card overflow-hidden !p-0" aria-label="Günler">
        <ul className="divide-y divide-line">
          {days.map((day) => (
            <li key={day}>
              <button
                type="button"
                onClick={() => { setFailed({ tr: false, en: false }); setLoaded({ tr: null, en: null }); setOpenDay(day); }}
                className="flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors hover:bg-surface-2/60 sm:px-5"
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
        <AppDialog title={dayLabel(openDay)} headline={dayLabel(openDay)} onClose={close} hideIdentity panelClassName="!max-w-[920px] !bg-surface sm:!p-5">
          {failed.tr || failed.en ? (
            <p role="alert" className="mt-4 text-sm text-danger">Günün metinleri yüklenemedi. Pencereyi kapatıp yeniden açın.</p>
          ) : loaded.tr?.day === openDay && loaded.en?.day === openDay ? (
            <BilingualDaySpeech key={openDay} day={openDay} loaded={{ tr: loaded.tr, en: loaded.en }} speech={speech} geminiReady={geminiReady} />
          ) : <p role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Türkçe ve İngilizce metinler yükleniyor…</p>}
        </AppDialog>
      ) : null}
    </>
  );
}

const languageName = (language: SpeechLanguage) => language === "tr" ? "Türkçe" : "İngilizce";

/** Two editable scripts, one set of controls. Every audio file keeps its own language. */
function BilingualDaySpeech({ day, loaded, speech, geminiReady }: { day: string; loaded: Bilingual<Loaded>; speech: boolean; geminiReady: boolean }) {
  const router = useRouter();
  /*
   * Which of the day's notes the recording is made of. Everything, to begin with — the summary is
   * the day — but a note that does not belong in a spoken bulletin (a correction, a second piece on
   * the same story) can be left out without editing it out of two scripts by hand afterwards.
   *
   * The ids are shared: both languages are the same rows read in a different column.
   */
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(loaded.tr.posts.map((post) => post.id)));
  const picked: Bilingual<Post[]> = {
    tr: loaded.tr.posts.filter((post) => chosen.has(post.id)),
    en: loaded.en.posts.filter((post) => chosen.has(post.id)),
  };
  const sources: Bilingual<string> = {
    tr: composeSummary(picked.tr, `${fullDateLabel(`${day}T12:00:00+03:00`, "tr")} · Günün özeti`),
    en: composeSummary(picked.en, `${fullDateLabel(`${day}T12:00:00+03:00`, "en")} · Günün özeti`),
  };
  const [drafts, setDrafts] = useState<Bilingual<string | null>>({ tr: null, en: null });
  const scripts: Bilingual<string> = {
    tr: drafts.tr ?? (picked.tr.length ? initialSpeechScript(sources.tr, day, "tr") : ""),
    en: drafts.en ?? (picked.en.length ? initialSpeechScript(sources.en, day, "en") : ""),
  };

  /* The scripts are made from the selection, so changing it writes them again — an edit made before
     the change was an edit to a different text. The two are never left disagreeing. */
  function choose(next: Set<string>) {
    setChosen(next);
    setDrafts({ tr: null, en: null });
  }
  function toggleNote(id: string) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id); else next.add(id);
    choose(next);
  }
  const [working, setWorking] = useState<string | null>(null);
  /** Which language the current run is on — the per-language buttons show their own progress. */
  const [running, setRunning] = useState<SpeechLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [takes, setTakes] = useState<Bilingual<Recording[]>>({ tr: loaded.tr.recordings, en: loaded.en.recordings });
  const [live, setLive] = useState({ tr: loaded.tr.published, en: loaded.en.published });
  const busy = working !== null;
  /*
   * A take already made is left alone unless the text on screen is no longer the text it was made
   * from. That is normally an edit — but leaving a note out changes the script just as much, and
   * with the selection narrowed the comparison has to be against the composed script rather than
   * against the edit that was never made. With the whole day selected, nothing changes.
   */
  const wholeDay = picked.tr.length === loaded.tr.posts.length && picked.en.length === loaded.en.posts.length;
  const toGenerate = languagesNeedingRecording(takes, wholeDay ? drafts : scripts);
  /** One language is recordable when its own script is usable; the pair when both are. */
  const canRecord = (language: SpeechLanguage) =>
    speech && geminiReady && !busy && toGenerate.includes(language)
    && !loaded[language].message && scripts[language].trim().length >= 40 && scripts[language].length <= MAX_SPEECH_CHARS;
  const canGenerate = toGenerate.length > 0 && toGenerate.every(canRecord);
  const totalTakes = takes.tr.length + takes.en.length;

  async function runBoth(label: string, task: (language: SpeechLanguage) => Promise<{ success: boolean; message: string }>, languages: readonly SpeechLanguage[] = speechLanguages) {
    setWorking(label);
    setError(null);
    try {
      const results = await runBilingualTasks(languages, async language => {
        setWorking(`${languageName(language)} · ${label}`);
        setRunning(language);
        return task(language);
      });
      const failures = languages.filter(language => !results[language]?.success).map(language => `${languageName(language)}: ${results[language]?.message}`);
      if (failures.length) setError(failures.join(" "));
      else showToast("İşlem tamamlandı.", "success");
    } finally { setWorking(null); setRunning(null); }
  }

  /**
   * Records the languages asked for — one of them, or both.
   *
   * The two recordings were always made as a pair, which is right when the day is being finished but
   * wrong the rest of the time: a script reworked in one language should not cost a second call to
   * the provider for the other, and a failure in one should not have to be retried through the one
   * that already worked.
   */
  async function generate(languages: readonly SpeechLanguage[]) {
    if (!languages.length || !languages.every(canRecord)) return;
    await runBoth("Ses kaydı oluşturuluyor…", async language => {
      const result = await createDaySpeechAction(day, scripts[language], language);
      if (result.success) {
        setTakes(current => ({ ...current, [language]: result.recordings }));
        router.refresh();
      }
      return result;
    }, languages);
  }

  async function publishBoth() {
    await runBoth("Son kayıt siteye yükleniyor…", async language => {
      const result = await publishRecordingAction(takes[language][0].id, language);
      if (result.success) { setLive(current => ({ ...current, [language]: true })); router.refresh(); }
      return result;
    });
  }

  async function withdrawBoth() {
    await runBoth("Yayından kaldırılıyor…", async language => {
      const result = await unpublishDayAudioAction(day, language);
      if (result.success) { setLive(current => ({ ...current, [language]: false })); router.refresh(); }
      return result;
    }, speechLanguages.filter(language => live[language]));
  }

  async function deleteTake(take: Recording) {
    await runBoth("Yerel kayıt siliniyor…", async language => {
      const result = await deleteRecordingAction(take.id, day, language);
      if (result.success) {
        setTakes(current => ({ ...current, [language]: result.recordings }));
        router.refresh();
      }
      return result;
    }, [take.language]);
  }

  async function copyBoth(texts: Bilingual<string>) {
    try { await navigator.clipboard.writeText([texts.tr, texts.en].filter(text => text.trim()).join("\n\n")); showToast("İki metin kopyalandı.", "success"); }
    catch { showToast("Metinler kopyalanamadı.", "error"); }
  }

  async function copyEpisodeText(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); showToast(`${label} kopyalandı.`, "success"); }
    catch { showToast("Kopyalanamadı. Metni seçerek kopyalayabilirsiniz.", "error"); }
  }

  return (
    <section className="mt-1" aria-label="Türkçe ve İngilizce ses kayıtları">
      <p className="mb-3 text-sm text-muted">Seslendirilecek notları seçin; metinler seçime göre yazılır. Metinleri aşağıdan düzenleyebilir veya kısaltabilirsiniz. Değiştirdiğiniz dil için yeni kayıt oluşturulur.</p>

      {loaded.tr.posts.length ? (
        <details className="group/notes mb-3 rounded-2xl border border-line" open>
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-3 text-[13px] [&::-webkit-details-marker]:hidden">
            <span className="font-semibold text-ink">Seslendirilecek notlar</span>
            <span className="tabular-nums text-muted">{picked.tr.length} / {loaded.tr.posts.length}</span>
            <span className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-3 text-xs"
                disabled={busy}
                onClick={(event) => {
                  event.preventDefault();
                  choose(picked.tr.length === loaded.tr.posts.length ? new Set() : new Set(loaded.tr.posts.map((post) => post.id)));
                }}
              >
                {picked.tr.length === loaded.tr.posts.length ? "Seçimi kaldır" : "Tümünü seç"}
              </Button>
              <ChevronDown className="size-4 text-muted group-open/notes:rotate-180" aria-hidden="true" />
            </span>
          </summary>
          <ul className="max-h-56 overflow-y-auto border-t border-line">
            {loaded.tr.posts.map((post) => (
              <li key={post.id} className="border-b border-line last:border-b-0">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={chosen.has(post.id)}
                    disabled={busy}
                    onChange={() => toggleNote(post.id)}
                    className="size-4 shrink-0 accent-[var(--color-ink)]"
                  />
                  <time dateTime={post.created_at} className="shrink-0 text-[11px] tabular-nums text-muted">{timeLabel(post.created_at, "tr")}</time>
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${chosen.has(post.id) ? "text-ink" : "text-faint line-through"}`}>{post.title || post.excerpt || "Başlıksız not"}</span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="mb-2 flex items-center justify-end gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="w-11 px-0" disabled={busy || (drafts.tr === null && drafts.en === null)} aria-label="İki metni sıfırla" title="İki metni sıfırla" onClick={() => setDrafts({ tr: null, en: null })}><RotateCcw className="size-4" aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="sm" className="w-11 px-0" aria-label="İki metni kopyala" title="İki metni kopyala" onClick={() => void copyBoth(scripts)}><Copy className="size-4" aria-hidden="true" /></Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {speechLanguages.map(language => (
          <div key={language} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface transition-colors focus-within:border-line-strong">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-2/40 px-3 py-2.5 text-xs">
              <label htmlFor={`speech-script-${language}`} className="flex items-center gap-2 font-semibold"><span className="rounded-md border border-line bg-surface px-1.5 py-1 text-[10px] uppercase tracking-wide">{language}</span>{languageName(language)}<span className="font-normal text-muted">{picked[language].length} haber</span></label>
              <span className={`tabular-nums ${scripts[language].length > MAX_SPEECH_CHARS ? "text-danger" : "text-muted"}`}>{scripts[language].length.toLocaleString("tr-TR")} / 6.000</span>
            </div>
            <div className="border-b border-line px-3 py-2.5">
                <Button type="button" size="sm" variant="ghost" disabled={!scripts[language].trim()} aria-label={`${languageName(language)} içeriğini kopyala`} onClick={() => void copyEpisodeText(scripts[language], `${languageName(language)} içeriği`)}><Copy size={14} aria-hidden="true" />İçeriği kopyala</Button>
            </div>
            <textarea id={`speech-script-${language}`} lang={language} value={scripts[language]} disabled={busy} maxLength={20_000} rows={7} placeholder={`${languageName(language)} konuşma metni…`}
              onChange={event => setDrafts(current => ({ ...current, [language]: event.target.value }))}
              className="block min-h-40 w-full resize-y border-0 bg-transparent px-3 py-3 text-[14px] leading-6 text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink disabled:opacity-60 sm:min-h-48" />
            <p className="flex items-center gap-1.5 border-t border-line bg-surface-2/30 px-3 py-2 text-[11px] tabular-nums text-muted" title="Dakikada 145 kelimelik okuma hızı, intro ve geçiş sesleriyle hesaplanır. Gerçek süre değişebilir."><Clock3 className="size-3.5" aria-hidden="true" />Tahmini süre <span className="ml-auto font-medium text-ink">{estimatedSpeechDuration(scripts[language], true)}</span></p>
            {loaded[language].message ? <p role="alert" className="mt-2 text-xs text-danger">{loaded[language].message}</p> : null}
            {speech ? (
              /* Each script carries its own record button: the language you have just reworked is
                 the one you want to hear, and waiting for the other language's call to finish first
                 is a minute spent for nothing. */
              <div className="border-t border-line px-3 py-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={!canRecord(language)}
                  title={!geminiReady ? "GEMINI_API_KEY tanımlı değil." : !toGenerate.includes(language) ? "Bu dilin kaydı güncel." : undefined}
                  onClick={() => void generate([language])}
                >
                  {running === language
                    ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    : <AudioLines className="size-4" aria-hidden="true" />}
                  {running === language ? "Kayıt alınıyor…" : toGenerate.includes(language) ? `${languageName(language)} kaydı oluştur` : "Kayıt güncel"}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {speech ? <>
        {!geminiReady ? <p role="status" className="mt-3 text-sm text-danger">Ses üretimini açmak için sunucuda GEMINI_API_KEY tanımlanmalı.</p> : null}
        {toGenerate.length === 2 ? (
          <div className="sticky -bottom-5 z-10 -mx-1 mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/95 px-1 py-3 backdrop-blur-sm sm:-bottom-5">
            <Button type="button" disabled={!canGenerate} className="min-w-56 shadow-sm max-sm:w-full" onClick={() => void generate(toGenerate)}>{working ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <AudioLines className="size-4" aria-hidden="true" />}{working ? "İşlem sürüyor…" : "İki dilde kayıt oluştur"}</Button>
          </div>
        ) : null}
      </> : null}
      {working ? <p role="status" className="mt-2 text-xs text-muted">{working}</p> : null}
      {error ? <p role="alert" className="mt-3 rounded-xl bg-danger-surface p-3 text-sm text-danger">{error}</p> : null}
      {live.tr || live.en ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-success-surface px-3 py-1"><span className="text-xs text-success">{speechLanguages.filter(language => live[language]).map(languageName).join(" ve ")} yayında</span><Button type="button" variant="ghost" size="sm" className="px-2 text-xs" disabled={busy} onClick={() => void withdrawBoth()}><Undo2 className="size-3.5" aria-hidden="true" />Yayından kaldır</Button></div> : null}
      {totalTakes ? <div className="mt-4 border-t border-line pt-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-muted">Yerel kayıtlar · {totalTakes}</h3><Button type="button" size="sm" variant="secondary" className="px-3" disabled={busy || !takes.tr.length || !takes.en.length} title="Her dilin en son kaydını siteye yükle" onClick={() => void publishBoth()}><Globe className="size-4" aria-hidden="true" />İki kaydı yayınla</Button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {speechLanguages.map(language => <div key={language} className="min-w-0"><h4 className="mb-2 text-xs font-semibold">{languageName(language)}</h4><ul className="space-y-2">{takes[language].map((take, index) => <li key={take.id}>
            <details className="group/take rounded-xl border border-line" open={index === 0}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-xs [&::-webkit-details-marker]:hidden"><AudioLines className="size-4 shrink-0 text-muted" aria-hidden="true" /><time dateTime={take.createdAt} className="min-w-0 flex-1 font-medium tabular-nums">{takeTime.format(new Date(take.createdAt))}</time><span className="text-muted">{take.voice || take.engine}</span><ChevronDown className="size-4 text-muted group-open/take:rotate-180" aria-hidden="true" /></summary>
              <div className="space-y-2 px-3 pb-3"><audio controls preload="none" src={`/gunun-ozeti/ses/${take.id}`} className="h-10 w-full" aria-label={`${languageName(language)} ses kaydı`} />
                <div className="flex items-center justify-end gap-1"><a href={`/gunun-ozeti/ses/${take.id}?download=1`} download={`gunun-ozeti-${take.day}-${take.language}.${take.format}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "px-3" })}><Download className="size-4" aria-hidden="true" />İndir</a><Button type="button" variant="ghost" size="sm" className="w-11 px-0" disabled={busy} aria-label={`${languageName(language)} kaydı sil`} onClick={() => void deleteTake(take)}><Trash2 className="size-4" aria-hidden="true" /></Button></div>
                <details><summary className="min-h-11 cursor-pointer text-xs leading-[44px] text-muted">Okunan metin</summary><p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm leading-6">{take.script}</p></details>
              </div>
            </details>
          </li>)}</ul></div>)}
        </div>
      </div> : null}
      {loaded.tr.scheduled.length || loaded.en.scheduled.length ? <details className="group/scheduled border-t border-line"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[13px] text-muted [&::-webkit-details-marker]:hidden">Planlı notlar<ChevronDown className="size-4 group-open/scheduled:rotate-180" aria-hidden="true" /></summary><p className="text-xs text-muted">Henüz yayımlanmadıkları için özete dahil değiller.</p><div className="grid gap-3 sm:grid-cols-2">{speechLanguages.map(language => <div key={language}><h4 className="py-2 text-xs font-semibold">{languageName(language)}</h4>{loaded[language].scheduled.map(post => <Link key={post.id} prefetch={false} href={`/yazilar/${post.id}/duzenle`} className="flex gap-3 border-t border-line py-2.5 text-xs"><time className="shrink-0 text-muted">{timeLabel(post.created_at, language)}</time><span className="line-clamp-2">{post.title || post.excerpt || "Başlıksız not"}</span></Link>)}</div>)}</div></details> : null}
    </section>
  );
}
