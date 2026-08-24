import type { Metadata } from "next";
import { Mail } from "lucide-react";
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
      <main className="w-full max-w-[720px] pt-12 sm:pt-16">
        <section className="visitor-panel rounded-panel bg-ink p-7 text-ink-contrast sm:p-12">
          <span className="grid size-11 place-items-center rounded-full bg-ink-contrast/10" aria-hidden="true"><Mail className="size-5" /></span>
          <h1 className="visitor-heading mt-7 text-[length:var(--vt-h1)] font-semibold tracking-[-.045em]">{isEnglish ? "Contact" : "İletişim"}</h1>
          <p className="visitor-copy mt-4 max-w-[520px] text-[length:var(--vt-small)] leading-7 text-on-dark [text-wrap:pretty]">
            {isEnglish ? "For questions, suggestions, and collaborations, reach us by email." : "Soru, öneri ve iş birlikleri için e-posta üzerinden bize ulaşabilirsiniz."}
          </p>
          <a href={`mailto:${settings.contactEmail}`} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-ink-contrast px-5 text-[length:var(--vt-ui)] font-bold text-ink transition-opacity hover:opacity-85">{settings.contactEmail}</a>
        </section>
      </main>
    </VisitorShell>
  );
}
