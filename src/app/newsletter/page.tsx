import type { Metadata } from "next";
import { NewsletterPanel } from "@/components/features/visitor/newsletter-panel";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return {
    title: { absolute: `${isEnglish ? "Newsletter" : "E-bülten"} · ${settings.siteName}` },
    description: isEnglish ? settings.newsletterDescriptionEn : settings.newsletterDescription,
    alternates: { canonical: languageHref("/newsletter", language), languages: { en: "/newsletter", tr: "/newsletter?lang=tr", "x-default": "/newsletter" } },
  };
}

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pt-12 sm:pt-16">
        <header className="mb-8 px-2 text-center">
          <h1 className="visitor-heading text-[length:var(--vt-h1)] font-semibold tracking-[-.045em]">{isEnglish ? "Newsletter" : "E-bülten"}</h1>
          <p className="visitor-muted mx-auto mt-4 max-w-[520px] text-[length:var(--vt-small)] leading-7 text-muted [text-wrap:pretty]">{isEnglish ? "A concise weekly selection delivered directly to your inbox." : "Haftanın kısa seçkisi doğrudan e-posta kutunuza gelsin."}</p>
        </header>
        {settings.moduleNewsletter && settings.newsletterEnabled
          ? <NewsletterPanel title={isEnglish ? settings.newsletterTitleEn : settings.newsletterTitle} description={isEnglish ? settings.newsletterDescriptionEn : settings.newsletterDescription} language={language} />
          : <div className="visitor-panel rounded-panel border border-line bg-surface p-10 text-center text-[length:var(--vt-small)] text-muted">{isEnglish ? "Newsletter subscriptions are currently closed." : "E-bülten aboneliği şu anda kapalı."}</div>}
      </main>
    </VisitorShell>
  );
}
