"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CircleAlert, ExternalLink, Eye, FlaskConical, LoaderCircle, MailCheck, Search, Send, Users } from "lucide-react";
import { loadIssueDayAction, sendDailyIssueAction, sendTestIssueAction, type IssueDayView } from "@/app/(dashboard)/bulten/actions";
import { AppDialog } from "@/components/ui/app-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast";
import { segmentClass, segmentGroupClass } from "@/components/ui/admin-segment";
import { bulletinDays } from "@/lib/visitor-date";
import type { VisitorLanguage } from "@/lib/visitor-language";
import type { SendReadiness } from "@/services/newsletter";

const sentAtFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
/** The weekday is part of the date everywhere the bulletin names a day, subject line included. */
const dayFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" });
const languageLabel: Record<VisitorLanguage, string> = { tr: "Türkçe", en: "İngilizce" };

const dayLabel = (day: string) => dayFormat.format(new Date(`${day}T12:00:00+03:00`));

/** "Dün" places a day faster than its date does, the same way the feed's separators name it. */
function relativeDay(day: string) {
  const { today, yesterday } = bulletinDays();
  if (day === today) return "Bugün";
  if (day === yesterday) return "Dün";
  return null;
}

/** `15 Eylül Salı` — the year is dropped while it is the current one, the way a diary drops it. */
const shortDayFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "Europe/Istanbul" });

/*
 * A sent day is marked rather than described: "· gönderildi" spelled out was long enough to push the
 * date out of the control it sits in, and a tick reads faster down a list of days anyway.
 */
function optionLabel(day: string, sent: boolean) {
  const date = new Date(`${day}T12:00:00+03:00`);
  const thisYear = date.getFullYear() === new Date().getFullYear();
  const relative = relativeDay(day);
  const label = thisYear ? shortDayFormat.format(date) : dayLabel(day);
  return `${sent ? "✓ " : ""}${relative ? `${relative} · ` : ""}${label}`;
}

/**
 * The bulletin, before it goes anywhere.
 *
 * The card opens on yesterday — the day a morning bulletin is about — and steps through every day
 * that has notes, so an issue that was missed can still be read through and sent. What is shown is
 * the prose the readers will receive, not a summary of it: the same paragraphs the message is built
 * from, under the subject line it will carry.
 *
 * Sending is one button because each reader gets the language they signed up in — the same rule the
 * push notes follow — so the language segments only change which version is being read. Who that
 * button reaches is the one thing chosen separately, next to it.
 */
export function DailyIssue({
  days,
  initialDay,
  initialViews,
  sentDays,
  addresses,
  mailReady,
  readiness,
}: {
  days: string[];
  initialDay: string;
  initialViews: IssueDayView[];
  sentDays: string[];
  /** Every address currently on the list, for the times a send is aimed at some of them. */
  addresses: { email: string; language: VisitorLanguage }[];
  mailReady: boolean;
  readiness: SendReadiness;
}) {
  const router = useRouter();
  /* Set around the send itself, so the day cannot be changed underneath a message on its way out. */
  const [pending, setPending] = useState(false);
  const [day, setDay] = useState(initialDay);
  const [views, setViews] = useState<IssueDayView[]>(initialViews);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState<VisitorLanguage>("tr");
  const [confirming, setConfirming] = useState(false);
  /* Who the next send is for. "all" is the bulletin as such; the rest are the narrower sends — one
     language's readers, or a few addresses being checked. */
  const [scope, setScope] = useState<"all" | VisitorLanguage | "addresses">("all");
  const [chosen, setChosen] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  /*
   * The message is fetched and handed to the frame as `srcdoc` rather than loaded into it by URL.
   * The site answers every request with `X-Frame-Options: DENY` and `frame-ancestors 'none'`, which
   * is exactly what we want everywhere else and what left this frame blank: a document that arrives
   * as markup instead of as a response is not subject to either.
   */
  const [preview, setPreview] = useState<{ status: "loading" | "error" } | { status: "ready"; html: string } | null>(null);

  /* Newest first, and the day the page opened on is kept in the list even if it has no notes — it is
     the day the panel is about, and a list that silently dropped it would look like a bug. */
  const dayList = useMemo(
    () => (days.includes(initialDay) ? days : [initialDay, ...days]),
    [days, initialDay],
  );
  const position = dayList.indexOf(day);

  /*
   * The day is fetched where it is chosen rather than in an effect: the click is the event, and the
   * effect would only be a second way of describing it. `latest` drops the answer to a day that is
   * no longer selected, which is what happens when two days are stepped through quickly.
   */
  const latest = useRef(initialDay);
  function chooseDay(next: string) {
    if (next === day) return;
    setDay(next);
    latest.current = next;
    if (next === initialDay) { setViews(initialViews); setLoading(false); return; }
    setLoading(true);
    void (async () => {
      try {
        const result = await loadIssueDayAction(next);
        if (latest.current !== next) return;
        if (!result.success) { showToast(result.message, "error"); return; }
        setViews(result.views);
      } catch {
        if (latest.current === next) showToast("Gün yüklenemedi. Lütfen tekrar deneyin.", "error");
      } finally {
        if (latest.current === next) setLoading(false);
      }
    })();
  }

  const view = views.find((item) => item.language === shown) ?? views[0];
  const totals = useMemo(() => ({
    notes: Math.max(...views.map((item) => item.paragraphs.length), 0),
    recipients: views.reduce((sum, item) => sum + (item.paragraphs.length ? item.recipients : 0), 0),
  }), [views]);

  /* What the button is about to reach, counted the same way the send itself counts it: a language
     with no notes sends to nobody, however many readers it has. */
  const target = useMemo(() => {
    if (scope === "addresses") return { count: chosen.length, label: "seçili adresler" };
    if (scope === "all") return { count: totals.recipients, label: "tüm aboneler" };
    const view = views.find((item) => item.language === scope);
    return { count: view?.paragraphs.length ? view.recipients : 0, label: `${languageLabel[scope].toLowerCase()} aboneler` };
  }, [scope, chosen, totals.recipients, views]);

  const alreadySent = views.filter((item) => item.sent);
  const warning = !mailReady
    ? "MAIL_KEY tanımlı değil; gönderim kapalı."
    : readiness === "missing"
      ? "20260916101500_newsletter_sending geçişi veritabanına uygulanmamış; çıkış anahtarı ve gönderim kaydı okunamıyor."
      : readiness === "error"
        ? "Veritabanına ulaşılamıyor; gönderim şu anda yapılamaz."
        : null;
  const canSend = mailReady && readiness === "ready" && !loading && totals.notes > 0 && target.count > 0;
  /* Why the button is off, on the button itself: a control that is greyed out with no reason next to
     it is the panel's way of saying "no" without saying why. */
  const blocked = warning
    ?? (loading ? "Gün yükleniyor."
      : !totals.notes ? "Bu gün yayımlanmış not yok."
        : !target.count ? (scope === "addresses" ? "Hiç adres seçilmedi." : "Gönderilecek abone yok.")
          : null);
  const sentSet = new Set(sentDays);

  function sendTest() {
    setPending(true);
    void (async () => {
      try {
        const result = await sendTestIssueAction(day, shown);
        showToast(result.message, result.success ? "success" : "error");
      } catch {
        showToast("Deneme gönderilemedi. Lütfen tekrar deneyin.", "error");
      } finally {
        setPending(false);
      }
    })();
  }

  const previewHref = `/bulten/onizleme?gun=${day}&dil=${shown}`;

  function openPreview() {
    setPreview({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch(previewHref, { credentials: "same-origin", headers: { accept: "text/html" } });
        const html = await response.text();
        setPreview(response.ok && !response.redirected && html ? { status: "ready", html } : { status: "error" });
      } catch {
        setPreview({ status: "error" });
      }
    })();
  }

  return (
    <>
      <section className="card mb-5 !p-0" aria-label="Bülten">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Önceki gün"
              className="!size-11 shrink-0 !px-0"
              disabled={loading || pending || position >= dayList.length - 1}
              onClick={() => chooseDay(dayList[position + 1])}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0 flex-1 lg:w-72 lg:flex-none">
              <label htmlFor="bulten-gun" className="sr-only">Bülten günü</label>
              <Select id="bulten-gun" className="!h-11 !rounded-full" value={day} disabled={loading || pending} onChange={(event) => chooseDay(event.target.value)}>
                {dayList.map((value) => (
                  <option key={value} value={value}>{optionLabel(value, sentSet.has(value))}</option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Sonraki gün"
              className="!size-11 shrink-0 !px-0"
              disabled={loading || pending || position <= 0}
              onClick={() => chooseDay(dayList[position - 1])}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 basis-[calc(50%-0.25rem)] lg:flex-none lg:basis-auto"
              disabled={!totals.notes || loading || pending || !mailReady}
              title={mailReady ? "Bu bülteni kendi adresinize gönderir" : "MAIL_KEY tanımlı değil; gönderim kapalı."}
              onClick={sendTest}
            >
              <FlaskConical className="size-4" aria-hidden="true" /> Deneme
            </Button>
            <Button type="button" variant="outline" className="h-11 flex-1 basis-[calc(50%-0.25rem)] lg:flex-none lg:basis-auto" disabled={!totals.notes || loading} onClick={openPreview}>
              <Eye className="size-4" aria-hidden="true" /> Önizle
            </Button>
            <Button
              type="button"
              className="h-11 basis-full lg:flex-none lg:basis-auto"
              disabled={!canSend || pending}
              title={blocked ?? undefined}
              onClick={() => setConfirming(true)}
            >
              {pending
                ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                : <Send className="size-4" aria-hidden="true" />}
              {alreadySent.length ? "Yeniden gönder" : "Gönder"}
            </Button>
          </div>
        </div>

        {/* Only what the toolbar cannot say for itself. The day is in the picker above it, the
            subject follows from the day, and the counts are on the segments and the tab — so this
            row exists for the two things that are news: that the day has gone out, and that
            something is stopping it from going out. */}
        {alreadySent.length || warning ? (
          <div className="border-b border-line px-4 py-3 sm:px-5">
            {alreadySent.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {views.map((item) => item.sent ? (
                  <Badge key={item.language} variant="success" className="h-6 gap-1 px-2 text-[11px]">
                    <MailCheck size={12} aria-hidden="true" />
                    {languageLabel[item.language]} · {item.sent.sentCount.toLocaleString("tr-TR")} e-posta · {sentAtFormat.format(new Date(item.sent.sentAt))}
                  </Badge>
                ) : item.paragraphs.length ? (
                  <Badge key={item.language} className="h-6 gap-1 px-2 text-[11px] text-muted">
                    {languageLabel[item.language]} · gönderilmedi
                  </Badge>
                ) : null)}
              </div>
            ) : null}
            {warning ? (
              <p className={`flex items-start gap-1.5 text-[12px] font-semibold text-warning ${alreadySent.length ? "mt-2" : ""}`}>
                <CircleAlert size={14} className="mt-px shrink-0" aria-hidden="true" />
                <span>{warning}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="bulten-alici" className="text-[12px] font-semibold text-muted">Alıcılar</label>
            <Select
              id="bulten-alici"
              className="!h-11 w-auto min-w-52 !rounded-full"
              value={scope}
              disabled={pending}
              onChange={(event) => {
                const next = event.target.value as typeof scope;
                setScope(next);
                if (next === "addresses") setPicking(true);
              }}
            >
              <option value="all">Tüm aboneler ({totals.recipients.toLocaleString("tr-TR")})</option>
              {views.map((item) => (
                <option key={item.language} value={item.language}>Yalnızca {languageLabel[item.language].toLowerCase()} ({item.recipients.toLocaleString("tr-TR")})</option>
              ))}
              <option value="addresses">Seçili adresler ({chosen.length.toLocaleString("tr-TR")})</option>
            </Select>
            {scope === "addresses" ? (
              <Button type="button" variant="outline" size="sm" className="h-11" onClick={() => setPicking(true)}>
                <Users className="size-4" aria-hidden="true" /> Adres seç
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <div className={segmentGroupClass} role="group" aria-label="Bülten dili">
            {views.map((item) => (
              <button key={item.language} type="button" aria-pressed={shown === item.language} onClick={() => setShown(item.language)} className={segmentClass(shown === item.language)}>
                {languageLabel[item.language]}
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${shown === item.language ? "bg-surface-3 text-ink-2" : "text-faint"}`}>{item.paragraphs.length.toLocaleString("tr-TR")}</span>
              </button>
            ))}
          </div>
          </div>
        </div>

        {loading ? (
          <p role="status" className="flex items-center gap-2 px-4 py-6 text-[13px] text-muted sm:px-5">
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Gün yükleniyor…
          </p>
        ) : view?.paragraphs.length ? (
          <div className="px-4 py-5 sm:px-6 sm:py-6" aria-label={`${languageLabel[view.language]} bülten metni`}>
            {view.paragraphs.map((paragraph, index) => (
              <p key={index} className={`text-[14px] leading-[1.75] ${index ? "mt-4 text-ink-2" : "text-ink"}`}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="px-4 py-5 text-[13px] text-muted sm:px-5">
            {totals.notes
              ? "Bu dilde o gün yayımlanmış not yok; bülten yalnızca diğer dile gönderilir."
              : "O gün yayımlanmış not yok; bülten gönderilmez."}
          </p>
        )}
      </section>

      {preview ? (
        <AppDialog
          title={`${dayLabel(day)} bülteni`}
          headline={<span className="text-[15px] font-semibold text-ink">{languageLabel[shown]} önizleme</span>}
          onClose={() => setPreview(null)}
          hideIdentity
          panelClassName="!max-w-[760px] !bg-surface sm:!p-5"
        >
          {preview.status === "ready" ? (
            /* `sandbox` with nothing allowed: the preview is a picture of a message, and nothing in
               it should be able to run, submit or navigate anywhere. */
            <iframe
              srcDoc={preview.html}
              sandbox=""
              title={`${dayLabel(day)} bülten önizlemesi`}
              className="mt-3 h-[min(70vh,620px)] w-full rounded-[14px] border border-line bg-white"
            />
          ) : (
            <p role="status" className="mt-3 flex h-40 items-center justify-center gap-2 text-[13px] text-muted">
              {preview.status === "loading"
                ? <><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Önizleme hazırlanıyor…</>
                : "Önizleme alınamadı. Oturumunuz sürüyorsa sayfayı yenileyip tekrar deneyin."}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[12px] text-muted">Gönderilecek ileti; çıkış bağlantısı örnektir.</p>
            <a
              href={previewHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink underline underline-offset-2"
            >
              <ExternalLink size={14} aria-hidden="true" /> Yeni sekmede aç
            </a>
          </div>
        </AppDialog>
      ) : null}

      {picking ? (
        <AddressPicker
          addresses={addresses}
          chosen={chosen}
          onClose={() => {
            setPicking(false);
            // Closing without choosing anybody would leave a scope that can never send.
            if (!chosen.length) setScope("all");
          }}
          onDone={(emails) => { setChosen(emails); setPicking(false); if (!emails.length) setScope("all"); }}
        />
      ) : null}

      {/* Every send is confirmed, not only a repeat: the button posts a letter to a few hundred
          people and cannot be called back, so the count and the day are put in front of the click. */}
      <ConfirmDialog
        open={confirming}
        title={alreadySent.length ? "Bülten yeniden gönderilsin mi?" : "Bülten gönderilsin mi?"}
        description={`${dayLabel(day)} bülteni ${target.label} (${target.count.toLocaleString("tr-TR")} adres) için ${alreadySent.length ? "tekrar " : ""}gönderilecek. Gönderilen e-posta geri alınamaz.`}
        confirmLabel={alreadySent.length ? "Yeniden gönder" : "Gönder"}
        onOpenChange={setConfirming}
        onConfirm={async () => {
          setPending(true);
          try {
            const result = await sendDailyIssueAction(day, alreadySent.length > 0, scope === "all"
              ? { kind: "all" }
              : scope === "addresses" ? { kind: "addresses", emails: chosen } : { kind: "language", language: scope });
            showToast(result.message, result.success ? "success" : "error");
            if (result.success) router.refresh();
            return result.success;
          } finally {
            setPending(false);
          }
        }}
      />
    </>
  );
}

/**
 * The addresses one send is aimed at.
 *
 * The whole list is already on the page — the "Alıcılar" tab renders it — so choosing from it needs
 * no request: search and selection both happen here. The choice is only applied when the dialog is
 * closed with it, which is what makes it safe to click through a list of a few hundred names.
 */
function AddressPicker({
  addresses,
  chosen,
  onClose,
  onDone,
}: {
  addresses: { email: string; language: VisitorLanguage }[];
  chosen: string[];
  onClose: () => void;
  onDone: (emails: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(chosen));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? addresses.filter((row) => row.email.includes(needle)) : addresses;
  }, [addresses, query]);

  function toggle(email: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email); else next.add(email);
      return next;
    });
  }

  const allVisibleChosen = visible.length > 0 && visible.every((row) => selected.has(row.email));

  return (
    <AppDialog title="Adres seç" headline={<span className="text-[15px] font-semibold text-ink">Adres seç</span>} onClose={onClose} hideIdentity panelClassName="!max-w-[560px] !bg-surface sm:!p-5">
      <div className="mt-3 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Adreslerde ara"
            placeholder="Adreslerde ara"
            className="h-11 pl-11 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0"
          disabled={!visible.length}
          onClick={() => setSelected((current) => {
            const next = new Set(current);
            for (const row of visible) { if (allVisibleChosen) next.delete(row.email); else next.add(row.email); }
            return next;
          })}
        >
          {allVisibleChosen ? "Seçimi kaldır" : "Tümünü seç"}
        </Button>
      </div>

      {visible.length ? (
        <ul className="mt-3 max-h-[46vh] overflow-y-auto rounded-[14px] border border-line" aria-label="Adresler">
          {visible.map((row) => (
            <li key={row.email} className="border-b border-line last:border-b-0">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(row.email)}
                  onChange={() => toggle(row.email)}
                  className="size-4 shrink-0 accent-[var(--color-ink)]"
                />
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{row.email}</span>
                <span className="shrink-0 text-[11px] text-faint">{languageLabel[row.language]}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-[14px] border border-line px-3 py-6 text-center text-[13px] text-muted">Eşleşen adres yok.</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px] tabular-nums text-muted">{selected.size.toLocaleString("tr-TR")} adres seçili</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={onClose}>Vazgeç</Button>
          <Button type="button" className="h-11" onClick={() => onDone([...selected])}>Seçimi uygula</Button>
        </div>
      </div>
    </AppDialog>
  );
}
