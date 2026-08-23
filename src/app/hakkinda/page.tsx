import type { Metadata } from "next";
import { Globe2, Mail } from "lucide-react";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorBackLink, VisitorShell } from "@/components/layout/visitor-shell";
import { getVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: { absolute: `Hakkında · ${settings.siteName}` },
    description: settings.description,
  };
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const settingsPromise = getSiteSettings();
  const query = await searchParams;
  const [language, settings] = await Promise.all([getVisitorLanguage(query.lang), settingsPromise]);
  const isEnglish = language === "en";
  const about = isEnglish ? settings.descriptionEn : settings.description;

  return (
    <VisitorShell language={language} siteName={settings.siteName} action={<VisitorBackLink language={language} />}>

      <main className="w-full max-w-[720px] pt-10">
        <header className="px-2 pb-8">
          <p className="visitor-muted text-xs font-bold tracking-[.16em] text-muted">{isEnglish ? "ABOUT" : "HAKKINDA"}</p>
          <h1 className="visitor-heading mt-3 text-[42px] font-semibold tracking-[-.055em] sm:text-[56px]">{settings.siteName}</h1>
        </header>

        <div className="space-y-3">
          <section className="visitor-panel rounded-panel bg-surface p-6 sm:p-9">
            <h2 className="visitor-heading text-[24px] font-semibold tracking-[-.04em]">{isEnglish ? "About" : "Hakkında"}</h2>
            <p className="visitor-copy mt-5 text-[18px] leading-8 text-ink [text-wrap:pretty]">{about}</p>
          </section>

          <section className="visitor-panel rounded-panel bg-surface p-6 sm:p-9">
            <div className="flex items-center gap-3"><Globe2 className="size-5" aria-hidden="true" /><h2 className="visitor-heading text-[24px] font-semibold tracking-[-.04em]">{isEnglish ? "Page settings" : "Sayfa ayarları"}</h2></div>

            <div className="mt-6 divide-y divide-line">
              <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <strong className="visitor-copy block text-[15px]">{isEnglish ? "Language" : "Dil"}</strong>
                  <p className="visitor-muted mt-1 text-sm text-muted">{isEnglish ? "Choose the language the feed is shown in." : "Akışın gösterileceği dili seçin."}</p>
                </div>
                <LanguagePicker language={language} />
              </div>

              <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <strong className="visitor-copy block text-[15px]">{isEnglish ? "Theme" : "Tema"}</strong>
                  <p className="visitor-muted mt-1 text-sm text-muted">{isEnglish ? "“System” follows your device setting." : "“Sistem” cihaz ayarınızı takip eder."}</p>
                </div>
                <ThemePicker language={language} />
              </div>

            </div>
          </section>

          <section className="visitor-panel rounded-panel bg-ink p-6 text-ink-contrast sm:p-9">
            <div className="flex items-center gap-3"><Mail className="size-5" /><h2 className="visitor-heading text-[24px] font-semibold tracking-[-.04em]">{isEnglish ? "Contact" : "İletişim"}</h2></div>
            <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-on-dark">{isEnglish ? "For questions, suggestions, and collaborations, reach us by email." : "Soru, öneri ve iş birlikleri için e-posta üzerinden bize ulaşabilirsiniz."}</p>
            <a href={`mailto:${settings.contactEmail}`} className="mt-7 inline-flex min-h-11 items-center rounded-full bg-ink-contrast px-5 text-sm font-bold text-ink transition-opacity hover:opacity-85">{settings.contactEmail}</a>
          </section>
        </div>
      </main>
    </VisitorShell>
  );
}
