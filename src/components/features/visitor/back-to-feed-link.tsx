"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { feedRestoreKey, readFeedPosition } from "@/components/features/visitor/feed-scroll-memory";

/**
 * "Back to feed" goes back to the feed the reader came from — the same address, so the notes they
 * had scrolled through are there, and their position in it. With nothing remembered it is a plain
 * link to the feed.
 */
export function BackToFeedLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const position = readFeedPosition();
    if (!position) return;
    // Only a feed in the same language counts as the feed they came from.
    const sameLanguage = new URL(position.href, location.origin).searchParams.get("lang") === new URL(href, location.origin).searchParams.get("lang");
    if (!sameLanguage) return;
    event.preventDefault();
    try { sessionStorage.setItem(feedRestoreKey, "1"); } catch { /* ignore */ }
    router.push(position.href);
  }

  return <Link href={href} onClick={onClick} className={className}>{children}</Link>;
}
