"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "diji-news-theme";
const themeAttribute = "data-visitor-theme";

/**
 * Runs before the first paint, inline in the document, so the page never flashes light before the
 * stored preference is read. Only rendered by the visitor shell — the admin panel has no dark
 * variant yet, and leaving the attribute unset there keeps it on the light tokens.
 */
export function ThemeScript() {
  const script = `(function(){try{var p=localStorage.getItem(${JSON.stringify(storageKey)});var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute(${JSON.stringify(themeAttribute)},d?"dark":"light");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/*
 * localStorage is an external store, so it is read through `useSyncExternalStore` rather than an
 * effect that calls setState. `storage` events only fire in *other* tabs, hence the local listener
 * list for changes made here.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): ThemePreference {
  try {
    const value = localStorage.getItem(storageKey);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch { /* Storage may be unavailable in private browsing modes. */ }
  return "system";
}

/** The server cannot know the preference, so it renders the default and React reconciles on mount. */
function getServerSnapshot(): ThemePreference {
  return "system";
}

function resolve(preference: ThemePreference) {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(preference: ThemePreference) {
  document.documentElement.setAttribute(themeAttribute, resolve(preference));
}

function setPreference(preference: ThemePreference) {
  try { localStorage.setItem(storageKey, preference); } catch { /* Storage may be unavailable. */ }
  apply(preference);
  listeners.forEach((listener) => listener());
}

const options: { value: ThemePreference; icon: typeof Sun; label: { tr: string; en: string } }[] = [
  { value: "light", icon: Sun, label: { tr: "Açık", en: "Light" } },
  { value: "dark", icon: Moon, label: { tr: "Koyu", en: "Dark" } },
  { value: "system", icon: Monitor, label: { tr: "Sistem", en: "System" } },
];

export function ThemePicker({ language }: { language: "tr" | "en" }) {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // While "Sistem" is selected the page has to follow the OS switching at runtime, not just on load.
  useEffect(() => {
    if (preference !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <div role="radiogroup" aria-label={language === "en" ? "Theme" : "Tema"} className="flex gap-1 rounded-full bg-surface-2 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(option.value)}
            className={`flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${selected ? "bg-ink text-ink-contrast" : "text-muted hover:text-ink"}`}
          >
            <Icon size={15} aria-hidden="true" />
            {option.label[language]}
          </button>
        );
      })}
    </div>
  );
}
