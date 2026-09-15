"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { VisitorBottomSheet } from "./visitor-bottom-sheet";
import { NewsletterContent } from "./newsletter-content";
import { resolveVisitorLanguage, type VisitorLanguage } from "@/lib/visitor-language";

const eventName = "visitor:open-newsletter";

export function NewsletterLink({ href, children, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  return <a {...props} href={href} aria-haspopup="dialog" onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    event.preventDefault();
    const url = new URL(href, window.location.href);
    window.dispatchEvent(new CustomEvent<VisitorLanguage>(eventName, { detail: resolveVisitorLanguage(url.searchParams.get("lang")) }));
  }}>{children}</a>;
}

export function NewsletterModal() {
  const [language, setLanguage] = useState<VisitorLanguage | null>(null);
  const close = useCallback((open: boolean) => { if (!open) setLanguage(null); }, []);
  useEffect(() => {
    const open = (event: Event) => setLanguage((event as CustomEvent<VisitorLanguage>).detail);
    window.addEventListener(eventName, open);
    return () => window.removeEventListener(eventName, open);
  }, []);
  if (!language) return null;
  const english = language === "en";
  return <VisitorBottomSheet open title={english ? "Newsletter" : "E-bülten"} closeLabel={english ? "Close" : "Kapat"} onOpenChange={close} panelClassName="newsletter-modal !max-w-[1000px] visitor-sans" titleClassName="text-xl font-semibold tracking-tight">
    <NewsletterContent key={language} language={language} modal />
  </VisitorBottomSheet>;
}
