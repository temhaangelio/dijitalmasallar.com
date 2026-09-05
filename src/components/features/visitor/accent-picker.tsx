"use client";

import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { accentAttribute, accentChangedEvent, accentOptions, accentStorageKey, resolveAccentPreference, type AccentPreference } from "@/lib/visitor-accent";
import type { VisitorLanguage } from "@/lib/visitor-language";

function subscribe(onChange: () => void) {
  window.addEventListener(accentChangedEvent, onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-visitor-theme"] });
  return () => {
    window.removeEventListener(accentChangedEvent, onChange);
    observer.disconnect();
  };
}
function snapshot(): AccentPreference {
  const value = document.documentElement.getAttribute(accentAttribute);
  return resolveAccentPreference(value, document.documentElement.getAttribute("data-visitor-theme"));
}
function choose(value: AccentPreference) {
  document.documentElement.setAttribute(accentAttribute, value);
  try { localStorage.setItem(accentStorageKey, value); } catch { /* Keep the selection for this page when storage is unavailable. */ }
  window.dispatchEvent(new Event(accentChangedEvent));
}

export function AccentPicker({ language }: { language: VisitorLanguage }) {
  const selected = useSyncExternalStore(subscribe, snapshot, () => "red");
  return (
    <div role="radiogroup" aria-label={language === "en" ? "Accent color" : "Vurgu rengi"} className="grid grid-cols-4 gap-0">
      {accentOptions.map((option, index) => (
        <button key={option.id} type="button" role="radio" aria-checked={selected === option.id} aria-label={option[language]} title={option[language]} tabIndex={selected === option.id ? 0 : -1}
          onClick={() => choose(option.id)}
          onKeyDown={(event) => {
            const directions: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
            if (!(event.key in directions) && event.key !== "Home" && event.key !== "End") return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? accentOptions.length - 1 : (index + directions[event.key]! + accentOptions.length) % accentOptions.length;
            choose(accentOptions[next]!.id);
            (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
          }}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-transparent transition-colors hover:bg-surface-2 aria-checked:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2">
          <span className="grid size-7 place-items-center rounded-full text-white" style={{ backgroundColor: option.light }}>
            {selected === option.id ? <Check className="size-4" strokeWidth={2} aria-hidden="true" /> : null}
          </span>
        </button>
      ))}
    </div>
  );
}
