"use client";

import { useEffect, useState } from "react";
import { Bot, LoaderCircle } from "lucide-react";
import { getAiScanStateAction } from "@/app/(dashboard)/yapay-zeka/actions";

export const aiScanStartedEvent = "diji-news:ai-scan-started";

export function AiNavigationStatus({ initiallyRunning, withLabel = false }: { initiallyRunning: boolean; withLabel?: boolean }) {
  const [running, setRunning] = useState(initiallyRunning);

  useEffect(() => {
    const markRunning = () => setRunning(true);
    window.addEventListener(aiScanStartedEvent, markRunning);
    return () => window.removeEventListener(aiScanStartedEvent, markRunning);
  }, []);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const check = async () => {
      const state = await getAiScanStateAction();
      if (!cancelled && state.status !== "running") setRunning(false);
    };
    const timer = window.setInterval(check, 2_000);
    void check();
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [running]);

  return <>
    {running ? <LoaderCircle size={18} className="shrink-0 animate-spin" aria-hidden="true" /> : <Bot size={18} className="shrink-0" aria-hidden="true" />}
    {withLabel ? <span className="sidebar-expanded-only truncate">Yapay zekâ</span> : null}
    <span className="sr-only">{running ? "Haberler taranıyor" : ""}</span>
  </>;
}
