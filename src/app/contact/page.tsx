import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { VisitorContentPage } from "@/components/features/visitor/visitor-content-page";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return {
    title: { absolute: `${isEnglish ? "Contact" : "İletişim"} · ${settings.siteName}` },
    description: isEnglish ? "Contact diji.news for questions, suggestions, and collaborations." : "Soru, öneri ve iş birlikleri için diji.news ile iletişime geçin.",
    alternates: { canonical: languageHref("/contact", language), languages: { en: "/contact", tr: "/contact?lang=tr", "x-default": "/contact" } },
  };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <VisitorContentPage
        title={isEnglish ? "Contact" : "İletişim"}
        intro={isEnglish ? "For questions, suggestions, and collaborations, reach us by email." : "Soru, öneri ve iş birlikleri için e-posta üzerinden bize ulaşabilirsiniz."}
      >
        <section className="flex flex-col gap-5 rounded-field bg-surface-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-labelledby="contact-email-title">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-ink-contrast" aria-hidden="true"><Mail className="size-5" /></span>
            <div className="min-w-0">
              <h2 id="contact-email-title" className="visitor-heading text-[length:var(--vt-h4)] font-semibold tracking-[-.025em]">{isEnglish ? "Email" : "E-posta"}</h2>
              <p className="visitor-muted mt-1 text-[length:var(--vt-ui)] leading-6 text-muted">{isEnglish ? "We will reply as soon as possible." : "En kısa sürede yanıt veririz."}</p>
            </div>
          </div>
          <a href={`mailto:${settings.contactEmail}`} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-[length:var(--vt-ui)] font-bold text-ink-contrast transition-opacity hover:opacity-85">{settings.contactEmail}</a>
        </section>
      </VisitorContentPage>
    </VisitorShell>
  );
}
