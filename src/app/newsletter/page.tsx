import type { Metadata } from "next";
import { NewsletterPanel } from "@/components/features/visitor/newsletter-panel";
import { VisitorContentPage } from "@/components/features/visitor/visitor-content-page";
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
      <VisitorContentPage
        title={isEnglish ? "Newsletter" : "E-bülten"}
        intro={isEnglish ? "A concise weekly selection delivered directly to your inbox." : "Haftanın kısa seçkisi doğrudan e-posta kutunuza gelsin."}
      >
        {settings.moduleNewsletter && settings.newsletterEnabled
          ? <NewsletterPanel title={isEnglish ? settings.newsletterTitleEn : settings.newsletterTitle} description={isEnglish ? settings.newsletterDescriptionEn : settings.newsletterDescription} language={language} />
          : <div className="visitor-muted rounded-field bg-surface-2 px-6 py-10 text-center text-[length:var(--vt-small)] text-muted">{isEnglish ? "Newsletter subscriptions are currently closed." : "E-bülten aboneliği şu anda kapalı."}</div>}
      </VisitorContentPage>
    </VisitorShell>
  );
}
