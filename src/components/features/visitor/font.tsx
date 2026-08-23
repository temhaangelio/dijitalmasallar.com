"use client";

import { BookOpen, Braces, Minus, Plus, Type } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Segmented, segmentClassName } from "@/components/ui/segmented";

export type FontPreference = "modern" | "classic" | "mono";

const storageKey = "diji-news-font";
const fontAttribute = "data-visitor-font";
const listeners = new Set<() => void>();

export function FontScript() {
  const script = `(function(){try{var p=localStorage.getItem(${JSON.stringify(storageKey)});document.documentElement.setAttribute(${JSON.stringify(fontAttribute)},p==="classic"||p==="mono"?p:"modern");}catch(e){}})();`;
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

function getSnapshot(): FontPreference {
  try {
    const value = localStorage.getItem(storageKey);
    if (value === "modern" || value === "classic" || value === "mono") return value;
  } catch { /* Storage may be unavailable in private browsing modes. */ }
  return "modern";
}

function getServerSnapshot(): FontPreference {
  return "modern";
}

function setPreference(preference: FontPreference) {
  try { localStorage.setItem(storageKey, preference); } catch { /* Storage may be unavailable. */ }
  document.documentElement.setAttribute(fontAttribute, preference);
  listeners.forEach((listener) => listener());
}

const options: { value: FontPreference; icon: typeof Type; label: { tr: string; en: string } }[] = [
  { value: "modern", icon: Type, label: { tr: "Modern", en: "Modern" } },
  { value: "classic", icon: BookOpen, label: { tr: "Klasik", en: "Classic" } },
  { value: "mono", icon: Braces, label: { tr: "Mono", en: "Mono" } },
];

export function FontPicker({ language }: { language: "tr" | "en" }) {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Segmented className="w-fit" role="radiogroup" label={language === "en" ? "Font" : "Yazı tipi"}>
      {options.map((option) => {
        const Icon = option.icon;
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-active={selected}
            onClick={() => setPreference(option.value)}
            className={segmentClassName(selected)}
          >
            <Icon size={15} aria-hidden="true" />
            {option.label[language]}
          </button>
        );
      })}
    </Segmented>
  );
}

export type FontSizePreference = "small" | "normal" | "large";

const sizeStorageKey = "diji-news-font-size";
const sizeAttribute = "data-visitor-font-size";
const sizeListeners = new Set<() => void>();

export function FontSizeScript() {
  const script = `(function(){try{var p=localStorage.getItem(${JSON.stringify(sizeStorageKey)});document.documentElement.setAttribute(${JSON.stringify(sizeAttribute)},p==="small"||p==="large"?p:"normal");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function subscribeToSize(onChange: () => void) {
  sizeListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    sizeListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSizeSnapshot(): FontSizePreference {
  try {
    const value = localStorage.getItem(sizeStorageKey);
    if (value === "small" || value === "normal" || value === "large") return value;
  } catch { /* Storage may be unavailable in private browsing modes. */ }
  return "normal";
}

function getSizeServerSnapshot(): FontSizePreference {
  return "normal";
}

function setSizePreference(preference: FontSizePreference) {
  try { localStorage.setItem(sizeStorageKey, preference); } catch { /* Storage may be unavailable. */ }
  document.documentElement.setAttribute(sizeAttribute, preference);
  sizeListeners.forEach((listener) => listener());
}

const sizeOptions: { value: FontSizePreference; icon: typeof Type; label: { tr: string; en: string } }[] = [
  { value: "small", icon: Minus, label: { tr: "Küçük", en: "Small" } },
  { value: "normal", icon: Type, label: { tr: "Normal", en: "Normal" } },
  { value: "large", icon: Plus, label: { tr: "Büyük", en: "Large" } },
];

export function FontSizePicker({ language }: { language: "tr" | "en" }) {
  const preference = useSyncExternalStore(subscribeToSize, getSizeSnapshot, getSizeServerSnapshot);

  return (
    <Segmented className="w-fit" role="radiogroup" label={language === "en" ? "Font size" : "Yazı boyutu"}>
      {sizeOptions.map((option) => {
        const Icon = option.icon;
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-active={selected}
            onClick={() => setSizePreference(option.value)}
            className={segmentClassName(selected)}
          >
            <Icon size={15} aria-hidden="true" />
            {option.label[language]}
          </button>
        );
      })}
    </Segmented>
  );
}
