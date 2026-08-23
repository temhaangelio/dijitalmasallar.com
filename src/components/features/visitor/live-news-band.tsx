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
    <aside className="live-news-band -mx-5 -mt-5 w-[calc(100%+2.5rem)] overflow-hidden border-b border-line-strong bg-ink text-ink-contrast" aria-label={language === "en" ? "Live news" : "Canlı haberler"}>
      <div className="mx-auto flex h-11 w-full max-w-[1120px] items-center">
        <div className="relative z-10 flex h-full shrink-0 items-center gap-2 bg-ink px-5 text-[11px] font-extrabold uppercase tracking-[.14em] shadow-[14px_0_20px_var(--color-ink)]">
          <span className="size-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
          {language === "en" ? "Live" : "Canlı"}
        </div>
        <div className="live-news-viewport min-w-0 flex-1 overflow-hidden">
          <div className="live-news-track flex w-max items-center motion-safe:hover:[animation-play-state:paused] motion-safe:focus-within:[animation-play-state:paused]">
            {[false, true].map((duplicate) => (
              <div key={String(duplicate)} className="flex shrink-0 items-center" aria-hidden={duplicate || undefined}>
                {items.map((post) => (
                  duplicate ? (
                    <span key={post.id} className="visitor-copy flex items-center whitespace-nowrap px-5 text-[13px] font-semibold text-ink-contrast/85">
                      <span className="mr-5 size-1 rounded-full bg-ink-contrast/40" aria-hidden="true" />{tickerText(post)}
                    </span>
                  ) : (
                    <Link key={post.id} href={languageHref(`/haber/${post.id}`, language)} className="visitor-copy flex items-center whitespace-nowrap px-5 text-[13px] font-semibold text-ink-contrast/85 transition-colors hover:text-ink-contrast focus:text-ink-contrast">
                      <span className="mr-5 size-1 rounded-full bg-ink-contrast/40" aria-hidden="true" />{tickerText(post)}
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
