"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribeToPushAction, unsubscribeFromPushAction } from "@/app/actions/push";
import { showToast } from "@/components/ui/toast";
import { Segmented, segmentClassName } from "@/components/ui/segmented";
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
function markSynced() {
  try { localStorage.setItem(syncKey, String(Date.now())); } catch { /* Storage may be unavailable. */ }
}

function clearSynced() {
  try { localStorage.removeItem(syncKey); } catch { /* Storage may be unavailable. */ }
}

function syncedRecently() {
  try {
    const last = Number(localStorage.getItem(syncKey) ?? 0);
    return Number.isFinite(last) && Date.now() - last < syncIntervalMs;
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

        if (syncedRecently()) return;
        const result = await subscribeToPushAction(subscription.toJSON(), language);
        if (result.success) markSynced();
      } catch {
        // A blocked worker, a private window, or storage that is unavailable: the page works either
        // way, and the reader can still turn notifications on by hand.
      }
    })();

    return () => { cancelled = true; };
  }, [language, publicKey]);

  return null;
}

export function PushToggle({ language, publicKey }: { language: VisitorLanguage; publicKey: string }) {
  // Safari on iOS only exposes push to an app that has been added to the home screen, so an
  // uninstalled iPhone reports "needs-install" rather than a plain "unsupported".
  const environment = useSyncExternalStore(subscribeToEnvironment, environmentSnapshot, serverEnvironment);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const isEnglish = language === "en";
  const state = environment !== "ready" ? environment : subscribed === null ? "loading" : subscribed ? "on" : "off";

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
      markSynced();
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

  if (state === "loading") return <span className="visitor-muted text-[length:var(--vt-ui)] text-faint">…</span>;

  if (state === "unsupported" || state === "needs-install" || state === "blocked") {
    const note = state === "needs-install"
      ? (isEnglish ? "Add the app to your home screen first." : "Önce uygulamayı ana ekranınıza ekleyin.")
      : state === "blocked"
        ? (isEnglish ? "Blocked in your browser settings." : "Tarayıcı ayarlarınızdan engellenmiş.")
        : (isEnglish ? "Not supported by this browser." : "Bu tarayıcı desteklemiyor.");
    return <span className="visitor-muted text-[length:var(--vt-ui)] leading-6 text-faint sm:max-w-[240px] sm:text-right">{note}</span>;
  }

  const options = [
    { value: "off" as const, icon: BellOff, label: isEnglish ? "Off" : "Kapalı" },
    { value: "on" as const, icon: Bell, label: isEnglish ? "On" : "Açık" },
  ];

  return (
    <Segmented className="w-full sm:w-fit" role="radiogroup" label={isEnglish ? "Notifications" : "Bildirimler"}>
      {options.map((option) => {
        const selected = state === option.value;
        const Icon = option.icon;
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
            className={cn(segmentClassName(selected), "flex-1 justify-center gap-1.5 px-2 disabled:cursor-wait sm:flex-none sm:gap-2 sm:px-3.5")}
          >
            <Icon size={15} className="hidden sm:block" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </Segmented>
  );
}

/**
 * The install control. Chrome and Edge hand over a prompt we can trigger; Safari on iOS has no such
 * API, so it gets the one sentence that says where the button lives. It always renders something —
 * it sits in a labelled settings row, and a row with an empty right-hand side reads as broken.
 */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function subscribeToNothing() { return () => {}; }

export function InstallPrompt({ language }: { language: VisitorLanguage }) {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const isEnglish = language === "en";
  // Only ever read on the client; the server render is the "no prompt available" case.
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  useEffect(() => {
    const onPrompt = (nativeEvent: Event) => {
      nativeEvent.preventDefault();
      setEvent(nativeEvent as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const note = (text: string) => (
    <span className="visitor-muted text-[length:var(--vt-ui)] leading-6 text-faint sm:max-w-[240px] sm:text-right">{text}</span>
  );

  if (!mounted) return note("…");
  if (installed || isStandalone()) return note(isEnglish ? "Already installed." : "Zaten yüklü.");

  if (event) {
    return (
      <button
        type="button"
        onClick={() => { void event.prompt().then(() => setEvent(null)); }}
        className="h-10 shrink-0 rounded-full bg-ink px-4 text-[length:var(--vt-ui)] font-semibold text-ink-contrast transition-opacity hover:opacity-85"
      >
        {isEnglish ? "Install" : "Yükle"}
      </button>
    );
  }

  if (isIos()) return note(isEnglish ? "Share ⎋ → Add to Home Screen" : "Paylaş ⎋ → Ana Ekrana Ekle");
  return note(isEnglish ? "Install from your browser's menu." : "Tarayıcınızın menüsünden yükleyebilirsiniz.");
}
