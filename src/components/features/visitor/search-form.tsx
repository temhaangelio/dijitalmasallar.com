"use client";

import Form from "next/form";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { defaultVisitorLanguage, languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { searchQueryLimit } from "@/lib/visitor-search";

/**
 * `next/form` rather than a hand-written form: the query stays in the URL — so a search can be
 * shared, bookmarked and reloaded — while submitting still performs a client-side navigation, and
 * the route is prefetched as soon as the field is on screen.
 *
 * The language travels as a hidden field because it lives in the query string too; without it a
 * Turkish reader would be bounced back to the English feed on the first search.
 */
function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="h-11 shrink-0 rounded-full bg-ink px-5 text-[length:var(--vt-ui)] font-semibold text-ink-contrast transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
    >
      <span aria-live="polite">{pending ? pendingLabel : label}</span>
    </button>
  );
}

export function SearchForm({ language, query }: { language: VisitorLanguage; query: string }) {
  const isEnglish = language === "en";

  return (
    <Form action="/search" scroll={false} className="visitor-panel flex items-center gap-2 rounded-full border border-line-strong bg-surface p-1.5 pl-4 shadow-[0_2px_10px_rgba(0,0,0,.04)] focus-within:border-ink">
      {language !== defaultVisitorLanguage ? <input type="hidden" name="lang" value={language} /> : null}
      <Search className="pointer-events-none size-[18px] shrink-0 text-faint" aria-hidden="true" />
      <label htmlFor="visitor-search" className="sr-only">{isEnglish ? "Search notes" : "Notlarda ara"}</label>
      <input
        // Re-keyed on the submitted query so the field follows the URL through back and forward
        // navigation instead of holding on to whatever was last typed into it.
        key={query}
        id="visitor-search"
        name="q"
        type="search"
        defaultValue={query}
        maxLength={searchQueryLimit}
        autoComplete="off"
        enterKeyHint="search"
        placeholder={isEnglish ? "Search every note" : "Tüm notlarda arayın"}
        className="visitor-copy h-11 min-w-0 flex-1 bg-transparent text-[length:var(--vt-small)] font-medium text-ink outline-none placeholder:text-faint"
      />
      {query ? (
        <Link
          href={languageHref("/search", language)}
          aria-label={isEnglish ? "Clear search" : "Aramayı temizle"}
          className="grid size-11 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={17} aria-hidden="true" />
        </Link>
      ) : null}
      <SubmitButton label={isEnglish ? "Search" : "Ara"} pendingLabel={isEnglish ? "Searching…" : "Aranıyor…"} />
    </Form>
  );
}
