"use client";

import { useEffect, useRef, type RefObject } from "react";

const focusableSelector = "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [contenteditable='true'], [tabindex]:not([tabindex='-1'])";

/** Shared scroll locking, initial focus, focus containment and restoration for admin dialogs. */
export function useModalFocus({ open, busy, panelRef, initialFocusRef, onClose }: {
  open: boolean;
  busy: boolean;
  panelRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const latest = useRef({ busy, onClose });
  useEffect(() => { latest.current = { busy, onClose }; }, [busy, onClose]);
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const opener = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = "hidden";
    const controls = () => [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter(node => (node.tabIndex >= 0 || (node.isContentEditable && !node.hasAttribute("tabindex"))) && node.getClientRects().length > 0);
    (initialFocusRef?.current ?? controls()[0] ?? panel).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]')].filter(node => node.getClientRects().length > 0);
      if (dialogs.at(-1) !== panel) return;
      if (event.key === "Escape") { event.preventDefault(); if (!latest.current.busy) latest.current.onClose(); return; }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) { event.preventDefault(); panel.focus(); return; }
      const outside = !panel.contains(document.activeElement) || document.activeElement === panel;
      if (event.shiftKey && (outside || document.activeElement === first)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (outside || document.activeElement === last)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = overflow;
      body.style.paddingRight = padding;
      if (opener?.isConnected) opener.focus();
    };
  }, [open, panelRef, initialFocusRef]);
}
