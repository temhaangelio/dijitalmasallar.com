import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadMoreButton } from "@/components/features/visitor/load-more-button";
import { NoteCard } from "@/components/features/visitor/note-card";
import { SearchForm } from "@/components/features/visitor/search-form";
import { VisitorNoteCardsSkeleton } from "@/components/feedback/route-skeletons";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { normalizeSearchQuery } from "@/lib/visitor-search";
import { languageHref, resolveVisitorLanguage, type VisitorLanguage } from "@/lib/visitor-language";
import { searchPublishedPosts } from "@/services/posts";
import { getSiteSettings, type SiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

/** How many results one page of the search shows, and how much each "more results" press adds. */
const resultsPerPage = 20;
const maxResults = 200;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return {
    title: { absolute: `${isEnglish ? "Search" : "Arama"} · ${settings.siteName}` },
    description: isEnglish ? "Search every note published on diji.news." : "diji.news'te yayınlanan tüm notlarda arayın.",
    // A result page is a view of the feed, not a document of its own; the notes themselves are what
    // belongs in the index. `follow` keeps the crawler walking through to them.
    robots: { index: false, follow: true },
    alternates: { canonical: languageHref("/search", language), languages: { en: "/search", tr: "/search?lang=tr", "x-default": "/search" } },
  };
}

function ResultCount({ total, shown, language }: { total: number; shown: number; language: VisitorLanguage }) {
  const isEnglish = language === "en";
  const label = isEnglish
    ? `${total} note${total === 1 ? "" : "s"} found${shown < total ? ` · showing ${shown}` : ""}`
    : `${total} not bulundu${shown < total ? ` · ${shown} tanesi gösteriliyor` : ""}`;
  return <p className="visitor-muted px-1 pb-4 text-[length:var(--vt-meta)] font-semibold uppercase tracking-[.13em] text-faint" aria-live="polite">{label}</p>;
}

function Message({ title, description }: { title: string; description: string }) {
  return (
    <div className="visitor-panel rounded-panel border border-line bg-surface px-6 py-14 text-center">
      <strong className="visitor-heading block text-[length:var(--vt-h4)] font-semibold tracking-[-.025em]">{title}</strong>
      <p className="visitor-muted mx-auto mt-2 max-w-[420px] text-[length:var(--vt-small)] leading-7 text-muted [text-wrap:pretty]">{description}</p>
    </div>
  );
}

/**
 * Split out of the page so the query runs inside its own Suspense boundary: the shell, the heading
 * and — above all — the search field stay on screen and keep their state while the next set of
 * results is being fetched.
 */
async function SearchResults({ query, language, limit, layout }: { query: string; language: VisitorLanguage; limit: number; layout: SiteSettings["feedLayout"] }) {
  const isEnglish = language === "en";
  const { posts, total } = await searchPublishedPosts(query, language, limit);

  if (!posts.length) {
    return (
      <Message
        title={isEnglish ? "No matching notes" : "Eşleşen not yok"}
        description={isEnglish
          ? `Nothing came up for “${query}”. Try a shorter word, or the name of the source.`
          : `“${query}” için sonuç çıkmadı. Daha kısa bir kelime ya da kaynağın adını deneyebilirsiniz.`}
      />
    );
  }

  return (
    <>
      <ResultCount total={total} shown={posts.length} language={language} />
      <div className="flex flex-col gap-4 sm:gap-5">
        {posts.map((post) => <NoteCard key={post.id} post={post} layout={layout} language={language} highlight={query} />)}
      </div>
      {total > posts.length && limit < maxResults ? (
        <div className="flex justify-center pt-8">
          <LoadMoreButton
            href={languageHref("/search", language, { q: query, limit: Math.min(limit + resultsPerPage, maxResults) })}
            label={isEnglish ? "More results" : "Daha fazla sonuç"}
          />
        </div>
      ) : null}
    </>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ lang?: string; q?: string; limit?: string }> }) {
  const params = await searchParams;
  const language = resolveVisitorLanguage(params.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const query = normalizeSearchQuery(params.q);
  const requestedLimit = Number.parseInt(params.limit ?? "", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, resultsPerPage), maxResults) : resultsPerPage;

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pb-6 pt-12 sm:pt-16">
        <header className="px-1 pb-7">
          <h1 className="visitor-heading text-[length:var(--vt-h1)] font-semibold tracking-[-.045em]">{isEnglish ? "Search" : "Arama"}</h1>
          <p className="visitor-muted mt-3 max-w-[560px] text-[length:var(--vt-small)] leading-7 text-muted [text-wrap:pretty]">
            {isEnglish
              ? "Every published note, searchable by its text, its category and its source."
              : "Yayınlanan tüm notlarda; metin, kategori ve kaynak adı üzerinden arayın."}
          </p>
        </header>

        <SearchForm language={language} query={query} />

        <div className="pt-9">
          {query ? (
            // Keyed on the query and the limit so a new search shows the skeleton rather than the
            // previous results sitting there greyed out.
            <Suspense key={`${query}-${limit}`} fallback={<VisitorNoteCardsSkeleton count={4} withCount />}>
              <SearchResults query={query} language={language} limit={limit} layout={settings.feedLayout} />
            </Suspense>
          ) : (
            <Message
              title={isEnglish ? "What are you looking for?" : "Ne aramıştınız?"}
              description={isEnglish
                ? "Type a word above — a topic, a company, or the name of a source — and press Search."
                : "Yukarıya bir kelime yazın — bir konu, bir şirket ya da bir kaynağın adı — ve Ara'ya basın."}
            />
          )}
        </div>
      </main>
    </VisitorShell>
  );
}
