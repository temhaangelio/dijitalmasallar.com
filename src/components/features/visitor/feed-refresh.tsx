"use client";

import { Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { VisitorLanguage } from "@/lib/visitor-language";

export function FeedRefresh({ language }: { language: VisitorLanguage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"idle" | "refreshing" | "done">("idle");
  const startedAt = useRef(0);
  const busy = pending || feedback === "refreshing";
  const isEnglish = language === "en";
  const label = isEnglish ? "Refresh feed" : "Akışı yenile";
  const status = busy
    ? (isEnglish ? "Refreshing feed" : "Akış yenileniyor")
    : feedback === "done"
      ? (isEnglish ? "Feed refreshed" : "Akış yenilendi")
      : "";

  // Keep a fast refresh legible, then briefly acknowledge its completion.
  useEffect(() => {
    if (feedback !== "refreshing" || pending) return;
    const timer = window.setTimeout(
      () => setFeedback("done"),
      Math.max(0, 650 - (Date.now() - startedAt.current)),
    );
    return () => window.clearTimeout(timer);
  }, [feedback, pending]);

  useEffect(() => {
    if (feedback !== "done") return;
    const timer = window.setTimeout(() => setFeedback("idle"), 1600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function refresh() {
    if (busy) return;
    startedAt.current = Date.now();
    setFeedback("refreshing");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        className="visitor-feed-refresh"
        aria-label={label}
        title={status || label}
        aria-busy={busy}
        disabled={busy}
        data-done={feedback === "done" || undefined}
        onClick={refresh}
      >
        {feedback === "done" && !busy
          ? <Check size={17} strokeWidth={1.7} aria-hidden="true" />
          : <RefreshCw size={17} strokeWidth={1.7} aria-hidden="true" className={busy ? "animate-spin motion-reduce:animate-none" : undefined} />}
      </button>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </>
  );
}
