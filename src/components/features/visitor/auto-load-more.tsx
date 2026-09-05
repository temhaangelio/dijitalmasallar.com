"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

/**
 * The feed keeps going on its own: when the end of the list comes into view, the page navigates to
 * the same route with a larger `limit`, and the server renders the longer feed.
 *
 * Going through the URL rather than appending posts on the client is what keeps one source of
 * truth — the ad slots, the day grouping and the sticky headings are all decided on
 * the server, and a reload or a shared link brings back exactly what the reader was looking at.
 *
 * `replace` rather than `push`: an infinite feed that stacks a history entry per screenful turns
 * the back button into a scroll bar.
 */
export function AutoLoadMore({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    // One navigation per href. The next render arrives with a larger limit, which re-runs this
    // effect and arms the observer again.
    let requested = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || requested) return;
      requested = true;
      startTransition(() => router.replace(href, { scroll: false }));
    }, { rootMargin: "800px 0px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [href, router]);

  return (
    <div ref={sentinel} className="flex min-h-24 items-center justify-center py-6" role="status" aria-live="polite" aria-atomic="true">
      {loading ? (
        <span className="visitor-sans inline-flex min-h-11 items-center gap-2.5 rounded-full bg-surface-2/60 px-4 text-[13px] font-normal leading-5 text-muted">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-accent motion-reduce:animate-none" strokeWidth={1.6} aria-hidden="true" />
          {label}
        </span>
      ) : null}
    </div>
  );
}
