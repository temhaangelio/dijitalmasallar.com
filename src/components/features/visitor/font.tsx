"use client";

import { useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/segmented";
import { segmentClassName } from "@/components/ui/segmented-style";
import { cn } from "@/lib/utils";
import {
  fontAttribute,
  fontStorageKey as storageKey,
  isReadingFont,
  isTextSize,
  readingFonts,
  textSizeAttribute,
  textSizeStorageKey as sizeStorageKey,
  textSizes,
  type ReadingFont,
  type TextSize,
} from "@/lib/visitor-font";

/**
 * Runs inline before the first paint, next to `ThemeScript`, so the stored face and size are on the
 * document element before any text is laid out — otherwise the page would set its type twice on
 * every load, and reflow under the reader.
 */
export function FontScript() {
  const script = `(function(){try{var e=document.documentElement;var f=localStorage.getItem(${JSON.stringify(storageKey)});e.setAttribute(${JSON.stringify(fontAttribute)},f==="sans"||f==="serif"?f:"hyperlegible");var s=localStorage.getItem(${JSON.stringify(sizeStorageKey)});e.setAttribute(${JSON.stringify(textSizeAttribute)},s==="small"||s==="large"?s:"normal");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): ReadingFont {
  try {
    const value = localStorage.getItem(storageKey);
    if (isReadingFont(value)) return value;
  } catch { /* Storage may be unavailable in private browsing modes. */ }
  return "hyperlegible";
}

/** The server cannot know the choice, so it renders the default and React reconciles on mount. */
function getServerSnapshot(): ReadingFont {
  return "hyperlegible";
}

function setPreference(font: ReadingFont) {
  try { localStorage.setItem(storageKey, font); } catch { /* Storage may be unavailable. */ }
  document.documentElement.setAttribute(fontAttribute, font);
  listeners.forEach((listener) => listener());
}

export function FontPicker({ language }: { language: "tr" | "en" }) {
  const font = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Segmented className="w-full sm:w-fit" role="radiogroup" label={language === "en" ? "Reading font" : "Yazı tipi"}>
      {readingFonts.map((option) => {
        const selected = font === option.value;
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
            className={cn(segmentClassName(selected), "min-w-0 flex-1 justify-center truncate px-3.5 sm:flex-none")}
          >
            {option.label[language]}
          </button>
        );
      })}
    </Segmented>
  );
}

function getSizeSnapshot(): TextSize {
  try {
    const value = localStorage.getItem(sizeStorageKey);
    if (isTextSize(value)) return value;
  } catch { /* Storage may be unavailable in private browsing modes. */ }
  return "normal";
}

function getServerSizeSnapshot(): TextSize {
  return "normal";
}

function setSize(size: TextSize) {
  try { localStorage.setItem(sizeStorageKey, size); } catch { /* Storage may be unavailable. */ }
  document.documentElement.setAttribute(textSizeAttribute, size);
  listeners.forEach((listener) => listener());
}

/** The same three-step control as the face, one shelf below it: small, the design's own size, large. */
export function TextSizePicker({ language }: { language: "tr" | "en" }) {
  const size = useSyncExternalStore(subscribe, getSizeSnapshot, getServerSizeSnapshot);

  return (
    <Segmented className="w-full sm:w-fit" role="radiogroup" label={language === "en" ? "Text size" : "Yazı boyutu"}>
      {textSizes.map((option) => {
        const selected = size === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label[language]}
            title={option.label[language]}
            data-active={selected}
            onClick={() => setSize(option.value)}
            className={cn(segmentClassName(selected), "min-w-0 flex-1 justify-center truncate px-3.5 sm:flex-none")}
          >
            {option.label[language]}
          </button>
        );
      })}
    </Segmented>
  );
}

/** Used by the settings sheet's reset: the default face and the design's own size. */
export function resetReading() {
  setPreference("hyperlegible");
  setSize("normal");
}
