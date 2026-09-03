"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSyncExternalStore } from "react";

const storageKey = "diji-news-admin-sidebar";
const attribute = "data-admin-sidebar";
const listeners = new Set<() => void>();

/**
 * Stamps the stored state on <html> before the first paint, so a collapsed sidebar never renders at
 * its full 248px and snaps shut a frame later. It runs on every admin page because the dashboard
 * layout is server-rendered on each request; a client-side navigation keeps the attribute already
 * on the element.
 */
export function AdminSidebarScript() {
  const script = `(function(){try{if(localStorage.getItem(${JSON.stringify(storageKey)})==="collapsed")document.documentElement.setAttribute(${JSON.stringify(attribute)},"collapsed");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/*
 * The width itself is driven entirely by CSS off that attribute — React is not involved in laying
 * the sidebar out. Only this button needs to know the state, for its icon and `aria-expanded`.
 */
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(storageKey) !== "collapsed";
  } catch {
    return true;
  }
}

/** The server cannot know the preference; the pre-paint script fixes the visual before hydration. */
function getServerSnapshot() {
  return true;
}

function setExpanded(expanded: boolean) {
  try { localStorage.setItem(storageKey, expanded ? "expanded" : "collapsed"); } catch { /* Storage may be unavailable. */ }
  if (expanded) document.documentElement.removeAttribute(attribute);
  else document.documentElement.setAttribute(attribute, "collapsed");
  listeners.forEach((listener) => listener());
}

export function SidebarToggle() {
  const expanded = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = expanded ? "Menüyü daralt" : "Menüyü genişlet";

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
      aria-label={label}
      title={label}
      className="sidebar-toggle-control grid size-10 shrink-0 place-items-center rounded-field text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {expanded ? <PanelLeftClose size={15} aria-hidden="true" /> : <PanelLeftOpen size={15} aria-hidden="true" />}
    </button>
  );
}
