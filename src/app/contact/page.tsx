import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export const metadata: Metadata = { title: "İletişim" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pb-10 pt-14 sm:pt-20"><section className="visitor-panel rounded-panel bg-ink p-7 text-ink-contrast sm:p-12"><Mail className="size-6" aria-hidden="true" /><h1 className="visitor-heading mt-8 text-[32px] font-semibold tracking-[-.045em] sm:text-[40px]">{isEnglish ? "Contact" : "İletişim"}</h1><p className="mt-5 max-w-[560px] text-[16px] leading-7 text-on-dark">{isEnglish ? "For questions, suggestions, and collaborations, reach us by email." : "Soru, öneri ve iş birlikleri için e-posta üzerinden bize ulaşabilirsiniz."}</p><a href={`mailto:${settings.contactEmail}`} className="mt-9 inline-flex min-h-11 items-center rounded-full bg-ink-contrast px-5 text-sm font-bold text-ink transition-opacity hover:opacity-85">{settings.contactEmail}</a></section></main>
    </VisitorShell>
  );
}
