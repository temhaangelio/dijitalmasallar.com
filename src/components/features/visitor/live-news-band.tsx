import Link from "next/link";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import type { Post } from "@/types/database";

function tickerText(post: Post) {
  const text = post.title || post.excerpt || post.body.split(/(?<=[.!?])\s/)[0] || post.body;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export function LiveNewsBand({ posts, language }: { posts: Post[]; language: VisitorLanguage }) {
  const items = posts.slice(0, 5);
  if (!items.length) return null;

  return (
    <aside className="live-news-band -mt-5 w-full max-w-[720px] overflow-hidden border-b border-line-strong bg-ink text-ink-contrast" aria-label={language === "en" ? "Live news" : "Canlı haberler"}>
      <div className="flex h-11 w-full items-center">
        <div className="flex h-full shrink-0 items-center gap-2 pl-5 pr-4 text-[length:var(--vt-eyebrow)] font-extrabold uppercase tracking-[.14em]">
          <span className="relative flex size-2 items-center justify-center" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-red-500/60 motion-safe:animate-ping" />
            <span className="relative size-2 rounded-full bg-red-500" />
          </span>
          {language === "en" ? "Live" : "Canlı"}
        </div>
        {/* `.live-news-viewport` masks both edges, so headlines fade in and out of the strip rather
            than being clipped at a hard boundary. */}
        <div className="live-news-viewport min-w-0 flex-1 overflow-hidden">
          <div className="live-news-track flex w-max items-center motion-safe:hover:[animation-play-state:paused] motion-safe:focus-within:[animation-play-state:paused]">
            {[false, true].map((duplicate) => (
              <div key={String(duplicate)} className="flex shrink-0 items-center" aria-hidden={duplicate || undefined}>
                {items.map((post) => (
                  duplicate ? (
                    <span key={post.id} className="visitor-copy flex items-center whitespace-nowrap px-5 text-[length:var(--vt-ui)] font-medium text-ink-contrast/80">
                      <span className="mr-5 size-1 rounded-full bg-ink-contrast/35" aria-hidden="true" />{tickerText(post)}
                    </span>
                  ) : (
                    <Link key={post.id} href={languageHref(`/haber/${post.id}`, language)} className="visitor-copy flex items-center whitespace-nowrap px-5 text-[length:var(--vt-ui)] font-medium text-ink-contrast/80 transition-colors hover:text-ink-contrast focus:text-ink-contrast">
                      <span className="mr-5 size-1 rounded-full bg-ink-contrast/35" aria-hidden="true" />{tickerText(post)}
                    </Link>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
