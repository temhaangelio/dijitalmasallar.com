"use client";

import Image from "next/image";
import { Bell, BellOff, BellRing, Check, Compass, Download, Globe, LoaderCircle, MoreVertical, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { subscribeToPushAction, unsubscribeFromPushAction } from "@/app/actions/push";
import { showToast } from "@/components/ui/toast";
import { Segmented } from "@/components/ui/segmented";
import { segmentClassName } from "@/components/ui/segmented-style";
import { cn } from "@/lib/utils";
import type { VisitorLanguage } from "@/lib/visitor-language";

/**
 * Web push, from the reader's side: registering the worker, asking for permission once, and keeping
 * the browser's subscription and the row in the database pointing at each other.
 */

const workerPath = "/sw.js";
const syncKey = "diji-news-push-synced";
/** The subscription is re-sent at most once a day; it is a keep-alive, not a heartbeat. */
const syncIntervalMs = 24 * 60 * 60 * 1000;

/** The VAPID key travels as URL-safe base64 and has to reach `subscribe()` as bytes. */
function applicationServerKey(publicKey: string) {
  const padded = publicKey.padEnd(publicKey.length + ((4 - (publicKey.length % 4)) % 4), "=");
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function register() {
  return navigator.serviceWorker.register(workerPath, { scope: "/", updateViaCache: "none" });
}

/* The sync stamp is written from module scope so the clock is never read while a component renders. */
function markSynced(language: VisitorLanguage) {
  try { localStorage.setItem(syncKey, JSON.stringify({ syncedAt: Date.now(), language })); } catch { /* Storage may be unavailable. */ }
}

function clearSynced() {
  try { localStorage.removeItem(syncKey); } catch { /* Storage may be unavailable. */ }
}

function syncedRecently(language: VisitorLanguage) {
  try {
    const saved = JSON.parse(localStorage.getItem(syncKey) ?? "null") as { syncedAt?: unknown; language?: unknown } | null;
    const syncedAt = Number(saved?.syncedAt ?? 0);
    return saved?.language === language && Number.isFinite(syncedAt) && Date.now() - syncedAt < syncIntervalMs;
  } catch {
    return false;
  }
}

/**
 * What the browser will allow, as one value. Permission has no change event of its own, so the
 * snapshot is re-read whenever the tab comes back into view — which is exactly when a reader
 * returns from the browser's own settings.
 */
type PushEnvironment = "loading" | "unsupported" | "needs-install" | "blocked" | "ready";

function subscribeToEnvironment(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function environmentSnapshot(): PushEnvironment {
  if (!pushSupported()) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  return Notification.permission === "denied" ? "blocked" : "ready";
}

function serverEnvironment(): PushEnvironment {
  return "loading";
}

/**
 * Mounted on every visitor page. It registers the worker — which is what makes the site
 * installable — and, for a reader who already said yes, quietly re-sends their subscription so the
 * stored row keeps up with endpoint rotation and with the language they now read in.
 */
export function ServiceWorkerRegistrar({ language, publicKey }: { language: VisitorLanguage; publicKey: string }) {
  useEffect(() => {
    if (!pushSupported()) return;
    let cancelled = false;

    void (async () => {
      try {
        const registration = await register();
        if (cancelled || !publicKey || Notification.permission !== "granted") return;
        const subscription = await registration.pushManager.getSubscription();
        if (cancelled || !subscription) return;

        if (syncedRecently(language)) return;
        const result = await subscribeToPushAction(subscription.toJSON(), language);
        if (result.success) markSynced(language);
      } catch {
        // A blocked worker, a private window, or storage that is unavailable: the page works either
        // way, and the reader can still turn notifications on by hand.
      }
    })();

    return () => { cancelled = true; };
  }, [language, publicKey]);

  return null;
}

type PushState = PushEnvironment | "on" | "off";

/**
 * Everything the two notification controls need: what the browser will allow, whether this reader is
 * subscribed, and the two calls that change it. The nav's bell and the settings row are the same
 * switch in two shapes, so they share one implementation rather than two that can disagree.
 */
function usePushSubscription(language: VisitorLanguage, publicKey: string) {
  // Safari on iOS only exposes push to an app that has been added to the home screen, so an
  // uninstalled iPhone reports "needs-install" rather than a plain "unsupported".
  const environment = useSyncExternalStore(subscribeToEnvironment, environmentSnapshot, serverEnvironment);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const isEnglish = language === "en";
  const state: PushState = environment !== "ready" ? environment : subscribed === null ? "loading" : subscribed ? "on" : "off";

  useEffect(() => {
    if (environment !== "ready") return;
    let cancelled = false;
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setSubscribed(Boolean(subscription));
      } catch {
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [environment]);

  async function turnOn() {
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        // A dismissed prompt leaves permission at "default"; a refusal flips the environment
        // snapshot to "blocked" on its own.
        setSubscribed(false);
        return;
      }
      const registration = (await navigator.serviceWorker.getRegistration(workerPath)) ?? (await register());
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(publicKey),
      });
      const result = await subscribeToPushAction(subscription.toJSON(), language);
      if (!result.success) {
        // The browser is subscribed but the server is not: undo it, so the two cannot disagree.
        await subscription.unsubscribe();
        setSubscribed(false);
        showToast(isEnglish ? "Notifications could not be turned on." : result.message, "error");
        return;
      }
      markSynced(language);
      setSubscribed(true);
      showToast(isEnglish ? "Notifications are on." : "Bildirimler açıldı.", "success");
    } catch {
      setSubscribed(false);
      showToast(isEnglish ? "Notifications could not be turned on." : "Bildirimler açılamadı.", "error");
    } finally {
      setPending(false);
    }
  }

  async function turnOff() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration(workerPath);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeFromPushAction(subscription.endpoint);
      }
      clearSynced();
      setSubscribed(false);
      showToast(isEnglish ? "Notifications are off." : "Bildirimler kapatıldı.", "success");
    } catch {
      showToast(isEnglish ? "Notifications could not be turned off." : "Bildirimler kapatılamadı.", "error");
    } finally {
      setPending(false);
    }
  }

  return { state, pending, turnOn, turnOff };
}

/**
 * The bell in the nav: one tap to start getting notes, one to stop. It keeps its place next to search
 * while the browser state is being resolved, and explains states that require action elsewhere.
 */
export function PushNavButton({ language, publicKey }: { language: VisitorLanguage; publicKey: string }) {
  const { state, pending, turnOn, turnOff } = usePushSubscription(language, publicKey);
  const isEnglish = language === "en";
  const configured = Boolean(publicKey);
  const on = state === "on";
  const label = pending
    ? (on ? (isEnglish ? "Turning notifications off" : "Bildirimler kapatılıyor") : (isEnglish ? "Turning notifications on" : "Bildirimler açılıyor"))
    : !configured
    ? (isEnglish ? "Notifications are not configured" : "Bildirimler yapılandırılmamış")
    : state === "loading"
    ? (isEnglish ? "Checking notifications" : "Bildirimler kontrol ediliyor")
    : state === "needs-install"
      ? (isEnglish ? "Add the app to your home screen first" : "Önce uygulamayı ana ekranınıza ekleyin")
      : state === "blocked"
        ? (isEnglish ? "Notifications are blocked in browser settings" : "Bildirimler tarayıcı ayarlarından engellenmiş")
        : state === "unsupported"
          ? (isEnglish ? "Notifications are not supported by this browser" : "Bu tarayıcı bildirimleri desteklemiyor")
          : on
            ? (isEnglish ? "Turn notifications off" : "Bildirimleri kapat")
            : (isEnglish ? "Turn notifications on" : "Bildirimleri aç");
  const disabled = configured && (pending || state === "loading" || state === "unsupported");

  function handleClick() {
    if (disabled) return;
    if (!configured) {
      showToast(isEnglish ? "Notifications are not configured on this deployment." : "Bu deployment için bildirimler yapılandırılmamış.", "error");
      return;
    }
    if (state === "needs-install") {
      showToast(isEnglish ? "Add the app to your home screen first." : "Bildirimler için önce uygulamayı ana ekranınıza ekleyin.", "error");
      return;
    }
    if (state === "blocked") {
      showToast(isEnglish ? "Allow notifications in your browser settings." : "Tarayıcı ayarlarından bildirim iznini açın.", "error");
      return;
    }
    void (on ? turnOff() : turnOn());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={on}
      aria-busy={pending || state === "loading"}
      aria-label={label}
      title={label}
      className="visitor-top-control disabled:cursor-not-allowed disabled:opacity-55"
    >
      {configured && (pending || state === "loading") ? <LoaderCircle size={18} strokeWidth={1.8} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : on ? <BellRing size={18} strokeWidth={1.8} aria-hidden="true" /> : state === "blocked" ? <BellOff size={18} strokeWidth={1.8} aria-hidden="true" /> : <Bell size={18} strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
}

export function PushToggle({ language, publicKey }: { language: VisitorLanguage; publicKey: string }) {
  const { state, pending, turnOn, turnOff } = usePushSubscription(language, publicKey);
  const isEnglish = language === "en";

  if (state === "loading" || pending) {
    const loadingLabel = state === "loading"
      ? (isEnglish ? "Checking…" : "Kontrol ediliyor…")
      : state === "on"
        ? (isEnglish ? "Turning off…" : "Kapatılıyor…")
        : (isEnglish ? "Turning on…" : "Açılıyor…");
    return (
      <span role="status" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-2 px-3 text-xs text-muted">
        <LoaderCircle className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {loadingLabel}
      </span>
    );
  }

  if (state === "unsupported" || state === "needs-install" || state === "blocked") {
    const note = state === "needs-install"
      ? (isEnglish ? "Add the app to your home screen first." : "Önce uygulamayı ana ekranınıza ekleyin.")
      : state === "blocked"
        ? (isEnglish ? "Blocked in your browser settings." : "Tarayıcı ayarlarınızdan engellenmiş.")
        : (isEnglish ? "Not supported by this browser." : "Bu tarayıcı desteklemiyor.");
    return <span className="visitor-muted text-[length:var(--vt-ui)] leading-6 text-muted sm:max-w-[240px] sm:text-right">{note}</span>;
  }

  const options = [
    { value: "off" as const, label: isEnglish ? "Off" : "Kapalı" },
    { value: "on" as const, label: isEnglish ? "On" : "Açık" },
  ];

  return (
    <Segmented className="w-full sm:w-fit" role="radiogroup" label={isEnglish ? "Notifications" : "Bildirimler"}>
      {options.map((option) => {
        const selected = state === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            disabled={pending}
            data-active={selected}
            onClick={() => { if (!selected && !pending) void (option.value === "on" ? turnOn() : turnOff()); }}
            className={cn(segmentClassName(selected), "flex-1 justify-center px-3.5 disabled:cursor-wait sm:flex-none")}
          >
            {option.label}
          </button>
        );
      })}
    </Segmented>
  );
}

/* ------------------------------------------------------------------ install */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

declare global {
  interface Window { __dijiInstallEvent?: InstallEvent | null }
}

const installReadyEvent = "diji-install-ready";
const dismissKey = "diji-news-install-dismissed";

/**
 * `beforeinstallprompt` fires once, and it can fire before React has hydrated — a listener added by
 * a component would simply miss it. This runs in `<head>`, keeps the event on `window`, and tells
 * the page about it, so the install controls can pick it up whenever they mount.
 */
export function InstallScript() {
  const script = `(function(){window.__dijiInstallEvent=null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__dijiInstallEvent=e;window.dispatchEvent(new Event(${JSON.stringify(installReadyEvent)}));});})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/*
 * The captured prompt is external state — it lives on `window`, put there by the head script — so it
 * is read through `useSyncExternalStore` rather than copied into React state by an effect. The
 * snapshot is a plain status string: an object identity would change on every read.
 */
type InstallStatus = "unknown" | "installed" | "ready" | "none";

const installListeners = new Set<() => void>();
let installedNow = false;

function notifyInstallListeners() {
  installListeners.forEach((listener) => listener());
}

function subscribeToInstall(onChange: () => void) {
  installListeners.add(onChange);
  const onPrompt = (nativeEvent: Event) => {
    nativeEvent.preventDefault();
    window.__dijiInstallEvent = nativeEvent as InstallEvent;
    notifyInstallListeners();
  };
  const onInstalled = () => {
    window.__dijiInstallEvent = null;
    installedNow = true;
    notifyInstallListeners();
  };
  window.addEventListener(installReadyEvent, notifyInstallListeners);
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    installListeners.delete(onChange);
    window.removeEventListener(installReadyEvent, notifyInstallListeners);
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

function installSnapshot(): InstallStatus {
  if (installedNow || isStandalone()) return "installed";
  return window.__dijiInstallEvent ? "ready" : "none";
}

function serverInstallSnapshot(): InstallStatus {
  return "unknown";
}

async function runInstall() {
  const event = window.__dijiInstallEvent;
  if (!event) return;
  await event.prompt();
  window.__dijiInstallEvent = null;
  notifyInstallListeners();
}

function InstallSteps({ language, platform }: { language: VisitorLanguage; platform: "ios" | "android" | "desktop" }) {
  const en = language === "en";
  const steps: ReactNode[] = platform === "ios" ? [
    en ? <>Open this website in <strong>Safari</strong>.</> : <>Bu siteyi <strong>Safari</strong> ile açın.</>,
    <span key="share">{en ? "Tap " : "Tarayıcıdaki "}<strong>{en ? "Share" : "Paylaş"}</strong>{en ? " in the browser. If hidden, open the (…) menu first." : " düğmesine dokunun. Görünmüyorsa önce (…) menüsünü açın."}</span>,
    <span key="add"><strong>{en ? "Add to Home Screen" : "Ana Ekrana Ekle"}</strong>{en ? ": scroll down the share menu to find it." : " seçeneğini bulun; gerekirse paylaşım listesini aşağı kaydırın."}</span>,
    en ? <>Keep <strong>Open as Web App</strong> enabled if shown, then tap <strong>Add</strong>.</> : <>Varsa <strong>Web Uygulaması Olarak Aç</strong> seçeneğini açık bırakıp <strong>Ekle</strong>’ye dokunun.</>,
  ] : platform === "android" ? [
    en ? <>Open this website in <strong>Chrome</strong>.</> : <>Bu siteyi <strong>Chrome</strong> ile açın.</>,
    en ? <>Tap the <strong>⋮</strong> menu at the top right.</> : <>Sağ üstteki <strong>⋮</strong> menüsüne dokunun.</>,
    en ? <>Choose <strong>Add to home screen</strong> or <strong>Install app</strong>, then confirm with <strong>Install</strong> or <strong>Add</strong>.</> : <><strong>Ana ekrana ekle</strong> veya <strong>Uygulamayı yükle</strong> seçeneğini seçin. Ardından <strong>Yükle</strong> ya da <strong>Ekle</strong> ile onaylayın.</>,
  ] : [
    en ? <>In <strong>Chrome or Edge</strong>, look for the install icon beside the address bar, or the install option in the browser menu.</> : <><strong>Chrome veya Edge</strong>’de adres çubuğunun yanındaki yükleme simgesini ya da tarayıcı menüsündeki uygulama yükleme seçeneğini açın.</>,
    en ? <>Confirm with <strong>Install</strong>. In Safari on Mac, use <strong>File → Add to Dock</strong> when available.</> : <><strong>Yükle</strong> ile onaylayın. Mac’te Safari kullanıyorsanız, varsa <strong>Dosya → Dock’a Ekle</strong> yolunu izleyin.</>,
  ];
  const icons = platform === "ios" ? [Compass, Share, SquarePlus, Check]
    : platform === "android" ? [Globe, MoreVertical, SquarePlus] : [Download, Check];
  return <div className="space-y-3 text-[13px] leading-6 text-ink-2">
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const Icon = icons[index];
        return <li key={index} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-2 text-ink-2"><Icon size={17} strokeWidth={1.6} /></span>
          <span className="min-w-0 flex-1"><span aria-hidden="true" className="mr-1.5 text-[11px] font-medium tabular-nums text-muted">{index + 1}.</span>{step}</span>
        </li>;
      })}
    </ol>
    {platform === "ios" && <p className="text-xs leading-5 text-muted">{en ? "Missing the option? At the bottom of the share list, tap Edit Actions and add Add to Home Screen." : "Seçenek yoksa paylaşım listesinin altındaki Eylemleri Düzenle bölümünden Ana Ekrana Ekle’yi ekleyin."}</p>}
    <p className="border-t border-line pt-3 text-xs leading-5 text-muted">{en ? "Once added, open Dijital Masallar from its new icon. No app store download is needed." : "İşlem tamamlanınca Dijital Masallar’ı eklenen simgesinden açabilirsiniz. Uygulama mağazasından indirmeniz gerekmez."}</p>
  </div>;
}

/** The settings panel explains the route available on the current device. */
export function InstallPrompt({ language }: { language: VisitorLanguage }) {
  const status = useSyncExternalStore(subscribeToInstall, installSnapshot, serverInstallSnapshot);
  const isEnglish = language === "en";
  if (status === "unknown") return <p role="status" className="text-xs text-muted">{isEnglish ? "Checking installation…" : "Yükleme durumu kontrol ediliyor…"}</p>;
  if (status === "installed") return <p className="text-[13px] leading-6 text-muted">{isEnglish ? "The app is installed. You can open it from its icon." : "Uygulama yüklü. Eklenen simgesinden açabilirsiniz."}</p>;
  if (status === "ready") return <div className="space-y-3">
    <p className="text-[13px] leading-6 text-muted">{isEnglish ? "Tap Install below, then confirm in your browser’s window. Dijital Masallar will open from its own icon." : "Aşağıdaki Yükle düğmesine dokunun, ardından tarayıcının açtığı pencerede onaylayın. Dijital Masallar kendi simgesinden açılacak."}</p>
    <button type="button" onClick={() => { void runInstall(); }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-semibold text-ink-contrast hover:opacity-85"><Download size={16} aria-hidden="true" />{isEnglish ? "Install" : "Yükle"}</button>
  </div>;
  const platform = isIos() ? "ios" : /Android/i.test(navigator.userAgent) ? "android" : "desktop";
  return <InstallSteps language={language} platform={platform} />;
}

/** Dismissal is remembered for good: a reader who said no once should not be asked on every visit. */
function installDismissed() {
  try { return localStorage.getItem(dismissKey) === "1"; } catch { return false; }
}

function rememberInstallDismissal() {
  try { localStorage.setItem(dismissKey, "1"); } catch { /* Storage may be unavailable. */ }
}

/**
 * The invitation to install, offered once, low on the first pages a reader opens.
 *
 * It waits a few seconds so it never competes with the first paint, it is only shown where it can
 * actually be accepted — a browser that handed over a prompt, or iOS Safari with its share sheet —
 * and closing it settles the question for good.
 */
export function InstallBanner({ language }: { language: VisitorLanguage }) {
  const status = useSyncExternalStore(subscribeToInstall, installSnapshot, serverInstallSnapshot);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const isEnglish = language === "en";
  const iosShareSheet = status === "none" && isIos();

  useEffect(() => {
    if (installDismissed()) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || closed || status === "installed" || status === "unknown") return null;
  if (status !== "ready" && !iosShareSheet) return null;

  const close = () => { setClosed(true); rememberInstallDismissal(); };

  return (
    <aside
      className="install-banner fixed inset-x-0 bottom-0 z-[150] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-label={isEnglish ? "Install dijitalmasallar.com" : "dijitalmasallar.com'u yükle"}
    >
      <div className="visitor-panel mx-auto flex w-full max-w-[560px] max-h-[75dvh] overflow-y-auto items-start gap-4 rounded-[24px] border border-line-strong bg-surface p-4 shadow-modal">
        {/* The mark is black on black in the dark theme, so it carries a hairline of its own. */}
        <Image src="/icon-192.png?v=6" alt="" width={44} height={44} className="size-11 shrink-0 rounded-[14px] border border-line-strong" />
        <div className="min-w-0 flex-1">
          <strong className="visitor-heading block text-[length:var(--vt-small)] font-semibold tracking-[-.02em]">
            {isEnglish ? "Add dijitalmasallar.com to your home screen" : "dijitalmasallar.com'u ana ekranınıza ekleyin"}
          </strong>
          <div className="visitor-muted mt-1 text-[length:var(--vt-ui)] leading-5 text-muted [text-wrap:pretty]">
            {status === "ready"
              ? (isEnglish ? "Tap Install, then confirm in the browser’s window." : "Yükle’ye dokunun, açılan tarayıcı penceresinde onaylayın.")
              : <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-[13px] font-medium text-ink">{isEnglish ? "How to add it · iPhone / iPad" : "Nasıl eklenir? · iPhone / iPad"}</summary><InstallSteps language={language} platform="ios" /></details>}
          </div>
        </div>
        {status === "ready" ? (
          <button
            type="button"
            onClick={() => { rememberInstallDismissal(); void runInstall(); }}
            className="min-h-11 shrink-0 rounded-full bg-ink px-4 text-[length:var(--vt-ui)] font-semibold text-ink-contrast transition-opacity hover:opacity-85"
          >
            {isEnglish ? "Install" : "Yükle"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={close}
          aria-label={isEnglish ? "Dismiss" : "Kapat"}
          className="grid size-11 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
