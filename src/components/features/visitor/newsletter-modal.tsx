"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import { VisitorBottomSheet } from "./visitor-bottom-sheet";
import { NewsletterContent } from "./newsletter-content";
import type { VisitorLanguage } from "@/lib/visitor-language";

const eventName = "visitor:open-newsletter";

/** A link to the newsletter page. It used to open a sheet; now it simply goes there. */
export function NewsletterLink({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  return <Link {...props} href={href}>{children}</Link>;
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
  return <VisitorBottomSheet open title={english ? "Newsletter" : "E-bülten"} closeLabel={english ? "Close" : "Kapat"} onOpenChange={close} panelClassName="newsletter-modal feed-sheet visitor-sans" titleClassName="text-xl font-semibold tracking-tight">
    <NewsletterContent key={language} language={language} modal />
  </VisitorBottomSheet>;
}
