import type { Metadata } from "next";
import { NewsletterContent } from "@/components/features/visitor/newsletter-content";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { VisitorPageHeading } from "@/components/features/visitor/page-heading";
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

/** A short introduction followed by the sign-up and an optional way to explore. */
export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="feed-column feed-page w-full">
        <VisitorPageHeading title={isEnglish ? "Newsletter" : "E-bülten"} />
        <NewsletterContent language={language} />
      </main>
    </VisitorShell>
  );
}
