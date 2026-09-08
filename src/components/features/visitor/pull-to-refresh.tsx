"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** How far the finger has to travel, after damping, before letting go refreshes. */
const threshold = 72;
/** The indicator never travels further than this, however far the finger goes. */
const maxPull = 112;
/** The indicator stays up at least this long, so a fast refresh still reads as one. */
const minVisibleMs = 650;

/**
 * Pull-to-refresh for the installed app on iOS.
 *
 * A web app opened from the home screen on iPhone has no address bar and no reload button, and
 * iOS gives standalone pages no pull gesture of its own — so a reader had no way to ask for new
 * notes short of closing the app. This adds the gesture there and only there: on a phone in the
 * browser Safari still has its reload, and Android's Chrome already performs the gesture natively,
 * where a second implementation would refresh the page twice.
 *
 * The handlers are passive; nothing here fights the scroll. iOS still rubber-bands the page while
 * the indicator descends, which is the feel readers expect from the native version anyway.
 */
export function PullToRefresh({ language }: { language: VisitorLanguage }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const shownAt = useRef(0);
  const isEnglish = language === "en";

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const android = /Android/i.test(navigator.userAgent);
    if (!standalone || android) return;

    const onStart = (event: TouchEvent) => {
      if (refreshing || event.touches.length !== 1 || window.scrollY > 0) { startY.current = null; return; }
      startY.current = event.touches[0]!.clientY;
    };
    const onMove = (event: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      if (window.scrollY > 0) { startY.current = null; pullRef.current = 0; setPull(0); return; }
      const delta = event.touches[0]!.clientY - startY.current;
      // Damped so the indicator slows as it goes, the way the native gesture does.
      const next = delta > 0 ? Math.min(maxPull, delta * 0.55) : 0;
      pullRef.current = next;
      setPull(next);
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= threshold && !refreshing) {
        pullRef.current = 0;
        shownAt.current = Date.now();
        setRefreshing(true);
        setPull(threshold);
        startTransition(() => router.refresh());
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refreshing, router]);

  // The refresh is over when the transition settles; keep the indicator up for the minimum first.
  useEffect(() => {
    if (!refreshing || pending) return;
    const wait = Math.max(0, minVisibleMs - (Date.now() - shownAt.current));
    const timer = window.setTimeout(() => {
      setDone(true);
      setRefreshing(false);
      setPull(0);
      window.setTimeout(() => setDone(false), 1400);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [refreshing, pending]);

  const armed = pull >= threshold;
  const visible = pull > 0 || refreshing;
  const label = refreshing
    ? (isEnglish ? "Refreshing" : "Yenileniyor")
    : armed
      ? (isEnglish ? "Release to refresh" : "Bırakınca yenilenir")
      : (isEnglish ? "Pull to refresh" : "Yenilemek için çek");

  return (
    <>
      <div
        aria-hidden="true"
        className="visitor-ptr"
        data-visible={visible || undefined}
        data-armed={armed || undefined}
        data-refreshing={refreshing || undefined}
        style={{ "--ptr-pull": `${pull}px`, "--ptr-progress": Math.min(1, pull / threshold) } as CSSProperties}
      >
        <span className="visitor-ptr-bits">
          <span className="visitor-ptr-bit">0</span>
          <span className="visitor-ptr-bit">1</span>
        </span>
        <span className="visitor-ptr-label visitor-sans">{label}</span>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {refreshing ? label : done ? (isEnglish ? "Feed refreshed" : "Akış yenilendi") : ""}
      </p>
    </>
  );
}
