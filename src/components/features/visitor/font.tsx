"use client";

import {
  fontAttribute,
  fontStorageKey as storageKey,
  textSizeAttribute,
  textSizeStorageKey as sizeStorageKey,
} from "@/lib/visitor-font";

/**
 * Runs inline before the first paint, next to `ThemeScript`. The reading face and size are fixed
 * now — the serif body, the large step — but the attributes stay on the document element because
 * the type rules are written against them.
 */
export function FontScript() {
  const script = `(function(){try{var e=document.documentElement;e.setAttribute(${JSON.stringify(fontAttribute)},"serif");e.setAttribute(${JSON.stringify(textSizeAttribute)},"large");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/** Clears anything an earlier build stored, and paints the fixed face and size. */
export function resetReading() {
  try { localStorage.removeItem(storageKey); localStorage.removeItem(sizeStorageKey); } catch { /* Storage may be unavailable. */ }
  document.documentElement.setAttribute(fontAttribute, "serif");
  document.documentElement.setAttribute(textSizeAttribute, "large");
}
