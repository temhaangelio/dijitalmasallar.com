"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Segmented, segmentClassName } from "@/components/ui/segmented";

type SourceBadgePreference = "show" | "hide";

const storageKey = "diji-news-source-badges";
const attribute = "data-visitor-source-badges";
const listeners = new Set<() => void>();

export function SourceBadgeScript() {
  const script = `(function(){try{var p=localStorage.getItem(${JSON.stringify(storageKey)});document.documentElement.setAttribute(${JSON.stringify(attribute)},p==="hide"?"hide":"show");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): SourceBadgePreference {
  try {
    return localStorage.getItem(storageKey) === "hide" ? "hide" : "show";
  } catch {
    return "show";
  }
}

function getServerSnapshot(): SourceBadgePreference {
  return "show";
}

function setPreference(preference: SourceBadgePreference) {
  try { localStorage.setItem(storageKey, preference); } catch { /* Storage may be unavailable. */ }
  document.documentElement.setAttribute(attribute, preference);
  listeners.forEach((listener) => listener());
}

export function SourceBadgePicker({ language }: { language: "tr" | "en" }) {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const options = [
    { value: "show" as const, icon: Eye, label: language === "en" ? "Show" : "Göster" },
    { value: "hide" as const, icon: EyeOff, label: language === "en" ? "Hide" : "Gizle" },
  ];

  return (
    <Segmented className="w-fit" role="radiogroup" label={language === "en" ? "Source badge" : "Kaynak rozeti"}>
      {options.map((option) => {
        const Icon = option.icon;
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            data-active={selected}
            onClick={() => setPreference(option.value)}
            className={`${segmentClassName(selected)} size-10 justify-center p-0`}
          >
            <Icon size={15} aria-hidden="true" />
          </button>
        );
      })}
    </Segmented>
  );
}
