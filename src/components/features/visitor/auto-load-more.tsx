"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The feed keeps going on its own: when the end of the list comes into view, the page navigates to
 * the same route with a larger `limit`, and the server renders the longer feed.
 *
 * Going through the URL rather than appending posts on the client is what keeps one source of
 * truth — the ad and newsletter slots, the day grouping and the sticky headings are all decided on
 * the server, and a reload or a shared link brings back exactly what the reader was looking at.
 *
 * `replace` rather than `push`: an infinite feed that stacks a history entry per screenful turns
 * the back button into a scroll bar.
 */
export function AutoLoadMore({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    // One navigation per href. The next render arrives with a larger limit, which re-runs this
    // effect and arms the observer again.
    let requested = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || requested) return;
      requested = true;
      setLoading(true);
      router.replace(href, { scroll: false });
    }, { rootMargin: "800px 0px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [href, router]);

  return (
    <div ref={sentinel} className="flex min-h-16 items-center justify-center py-10" aria-live="polite" aria-busy={loading}>
      {loading ? (
        <span className="visitor-muted inline-flex items-center gap-3 text-[length:var(--vt-ui)] font-semibold text-faint">
          <span className="relative block size-4" aria-hidden="true">
            <span className="diji-loading-dot absolute left-0 top-0 size-2 rounded-full bg-ink [--diji-loading-travel:8px]" />
          </span>
          {label}
        </span>
      ) : null}
    </div>
  );
}
