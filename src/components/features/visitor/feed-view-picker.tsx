"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { feedViewAttribute, feedViewChangedEvent, feedViewStorageKey, resolveFeedView, type FeedView } from "@/lib/visitor-feed-view";
import type { VisitorLanguage } from "@/lib/visitor-language";

/** Restore the layout before paint and synchronize open tabs without a page reload. */
export function FeedViewScript() {
  const script = `(function(){var key=${JSON.stringify(feedViewStorageKey)};function apply(v){document.documentElement.setAttribute(${JSON.stringify(feedViewAttribute)},v==="rows"?"rows":"cards");window.dispatchEvent(new Event(${JSON.stringify(feedViewChangedEvent)}));}try{apply(localStorage.getItem(key));}catch(e){apply(null);}window.addEventListener("storage",function(e){if(e.key===key||e.key===null)apply(e.newValue);});})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function subscribe(onChange: () => void) {
  window.addEventListener(feedViewChangedEvent, onChange);
  return () => window.removeEventListener(feedViewChangedEvent, onChange);
}

function snapshot(): FeedView {
  return resolveFeedView(document.documentElement.getAttribute(feedViewAttribute));
}

function choose(value: FeedView) {
  document.documentElement.setAttribute(feedViewAttribute, value);
  try { localStorage.setItem(feedViewStorageKey, value); } catch { /* Still applies during this visit when storage is unavailable. */ }
  window.dispatchEvent(new Event(feedViewChangedEvent));
}

export function FeedViewPicker({ language }: { language: VisitorLanguage }) {
  const selected = useSyncExternalStore(subscribe, snapshot, () => "cards");
  const isEnglish = language === "en";
  const next = selected === "cards" ? "rows" : "cards";
  const Icon = next === "rows" ? Rows3 : LayoutGrid;
  const label = next === "rows"
    ? (isEnglish ? "Switch to row view" : "Satır görünümüne geç")
    : (isEnglish ? "Switch to card view" : "Kart görünümüne geç");
  return (
    <button type="button" className="visitor-feed-view-picker" aria-label={label} title={label} onClick={() => choose(next)}>
      <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}
