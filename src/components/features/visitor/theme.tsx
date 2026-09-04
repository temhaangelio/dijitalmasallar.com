"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/segmented";
import { segmentClassName } from "@/components/ui/segmented-style";
import { cn } from "@/lib/utils";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "diji-news-theme";
const themeAttribute = "data-visitor-theme";
const lightThemeColor = "#f8f8f5";
const darkThemeColor = "#0f0f0f";

/**
 * Runs before the first paint, inline in the document, so the page never flashes light before the
 * stored preference is read. Only rendered by the visitor shell — the admin panel has no dark
 * variant yet, and leaving the attribute unset there keeps it on the light tokens.
 */
export function ThemeScript() {
  const script = `(function(){try{var p=localStorage.getItem(${JSON.stringify(storageKey)});var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute(${JSON.stringify(themeAttribute)},d?"dark":"light");document.querySelectorAll('meta[name="theme-color"]').forEach(function(n){n.remove()});var m=document.createElement("meta");m.name="theme-color";m.content=d?${JSON.stringify(darkThemeColor)}:${JSON.stringify(lightThemeColor)};m.setAttribute("data-diji-theme","");document.head.appendChild(m);}catch(e){}})();`;
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

function syncBrowserThemeColor(theme: "light" | "dark") {
  const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
  let meta = metas.find((candidate) => candidate.hasAttribute("data-diji-theme")) ?? metas[0];
  metas.forEach((candidate) => { if (candidate !== meta) candidate.remove(); });
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.dataset.dijiTheme = "";
    document.head.appendChild(meta);
  }
  meta.removeAttribute("media");
  meta.dataset.dijiTheme = "";
  meta.content = theme === "dark" ? darkThemeColor : lightThemeColor;
}

function apply(preference: ThemePreference) {
  const theme = resolve(preference);
  document.documentElement.setAttribute(themeAttribute, theme);
  syncBrowserThemeColor(theme);
}

function setPreference(preference: ThemePreference) {
  try { localStorage.setItem(storageKey, preference); } catch { /* Storage may be unavailable. */ }
  apply(preference);
  listeners.forEach((listener) => listener());
}

const options: { value: ThemePreference; label: { tr: string; en: string } }[] = [
  { value: "light", label: { tr: "Açık", en: "Light" } },
  { value: "dark", label: { tr: "Koyu", en: "Dark" } },
  { value: "system", label: { tr: "Sistem", en: "System" } },
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
    <Segmented className="w-full sm:w-fit" role="radiogroup" label={language === "en" ? "Theme" : "Tema"}>
      {options.map((option) => {
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label[language]}
            title={option.label[language]}
            data-active={selected}
            onClick={() => setPreference(option.value)}
            className={cn(segmentClassName(selected), "flex-1 justify-center px-3.5 sm:flex-none")}
          >
            {option.label[language]}
          </button>
        );
      })}
    </Segmented>
  );
}
