import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/features/visitor/newsletter-form";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const title = isEnglish ? "Newsletter" : "E-bülten";
  const description = isEnglish
    ? "The daily technology briefing, in your inbox."
    : "Günlük teknoloji özeti e-postanızda.";
  return {
    title: { absolute: `${title} · ${settings.siteName}` },
    description,
    alternates: {
      canonical: languageHref("/ebulten", language),
      languages: { tr: "/ebulten", en: "/ebulten?lang=en", "x-default": "/ebulten" },
      types: { "application/rss+xml": languageHref("/feed.xml", language) },
    },
    openGraph: { type: "website", siteName: settings.siteName, title: `${title} · ${settings.siteName}`, description, url: languageHref("/ebulten", language), locale: isEnglish ? "en_US" : "tr_TR" },
    twitter: { card: "summary", title: `${title} · ${settings.siteName}`, description },
  };
}

/** One card: what arrives, the field, and one line about the address. */
export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="visitor-wide-page mt-6 w-full max-w-[640px] sm:mt-9">
        <header className="mb-6">
          <h1 className="visitor-sans text-[28px] leading-tight text-ink sm:text-[32px]">{isEnglish ? "Newsletter" : "E-bülten"}</h1>
        </header>

        <div className="visitor-card visitor-newsletter-card">
          <section className="visitor-newsletter-main">
            <span className="visitor-newsletter-mark" aria-hidden="true"><Mail size={20} strokeWidth={1.7} /></span>
            <p className="visitor-newsletter-lead visitor-sans">{isEnglish
              ? "The daily technology briefing, in your inbox."
              : "Günlük teknoloji özeti e-postanızda."}</p>
            <NewsletterForm language={language} />
            <p className="visitor-newsletter-terms visitor-sans">{isEnglish
              ? "Only for the newsletter. Leave any time."
              : "Yalnızca bülten için. İstediğiniz an çıkabilirsiniz."}</p>
          </section>
        </div>
      </main>
    </VisitorShell>
  );
}
