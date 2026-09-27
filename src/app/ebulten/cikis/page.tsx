import type { Metadata } from "next";
import { NewsletterUnsubscribe } from "@/components/features/visitor/newsletter-unsubscribe";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

/** A page reached only from a link in a message: nothing about it belongs in an index. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewsletterUnsubscribePage({ searchParams }: { searchParams: Promise<{ lang?: string; t?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";

  return (
    <VisitorShell language={language} siteName={settings.siteName} compact>
      <main className="visitor-wide-page mt-6 w-full max-w-[640px] sm:mt-9">
        <header className="mb-6">
          <h1 className="visitor-sans text-[28px] leading-tight text-ink sm:text-[32px]">
            {isEnglish ? "Leave the newsletter" : "E-bültenden çık"}
          </h1>
        </header>
        <NewsletterUnsubscribe token={query.t ?? ""} language={language} />
      </main>
    </VisitorShell>
  );
}
