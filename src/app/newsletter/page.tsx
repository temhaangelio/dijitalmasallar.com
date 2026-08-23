import type { Metadata } from "next";
import { NewsletterPanel } from "@/components/features/visitor/newsletter-panel";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: { absolute: `E-bülten · ${settings.siteName}` }, description: settings.newsletterDescription };
}

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pb-10 pt-14 sm:pt-20">
        <header className="mb-8 px-2 text-center"><h1 className="visitor-heading text-[32px] font-semibold tracking-[-.045em] sm:text-[40px]">{isEnglish ? "Newsletter" : "E-bülten"}</h1><p className="visitor-muted mx-auto mt-4 max-w-[520px] text-[15px] leading-7 text-muted">{isEnglish ? "A concise weekly selection delivered directly to your inbox." : "Haftanın kısa seçkisi doğrudan e-posta kutunuza gelsin."}</p></header>
        {settings.moduleNewsletter && settings.newsletterEnabled ? <NewsletterPanel title={isEnglish ? settings.newsletterTitleEn : settings.newsletterTitle} description={isEnglish ? settings.newsletterDescriptionEn : settings.newsletterDescription} language={language} /> : <div className="visitor-panel rounded-panel bg-surface p-8 text-center text-muted">{isEnglish ? "Newsletter subscriptions are currently closed." : "E-bülten aboneliği şu anda kapalı."}</div>}
      </main>
    </VisitorShell>
  );
}
