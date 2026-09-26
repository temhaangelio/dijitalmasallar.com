"use client";

import { useSearchParams } from "next/navigation";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { resolveVisitorLanguage } from "@/lib/visitor-language";

/**
 * The real sections, for a loading screen. A loading screen cannot be told the reader's language,
 * so it reads it from the address — the same `lang` the page itself will use a moment later.
 */
export function VisitorHeaderNavFallback() {
  return <VisitorHeaderNav language={resolveVisitorLanguage(useSearchParams().get("lang"))} />;
}
