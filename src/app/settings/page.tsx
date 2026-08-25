import type { Metadata } from "next";
import { FontPicker, FontSizePicker } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Sayfa ayarları", robots: { index: false, follow: true } };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const rows = [
    { title: isEnglish ? "Language" : "Dil", description: isEnglish ? "Choose the language used across the site." : "Sitede kullanılacak dili seçin.", control: <LanguagePicker language={language} path="/settings" /> },
    { title: isEnglish ? "Theme" : "Tema", description: isEnglish ? "System follows your device setting." : "Sistem seçeneği cihaz ayarınızı takip eder.", control: <ThemePicker language={language} /> },
    { title: isEnglish ? "Font" : "Yazı tipi", description: isEnglish ? "Choose the typeface used on visitor pages." : "Ziyaretçi sayfalarında kullanılacak yazı tipini seçin.", control: <FontPicker language={language} /> },
    { title: isEnglish ? "Font size" : "Yazı boyutu", description: isEnglish ? "Adjust the reading size across visitor pages." : "Ziyaretçi sayfalarındaki okuma boyutunu ayarlayın.", control: <FontSizePicker language={language} /> },
  ];
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pt-12 sm:pt-16">
        <section className="visitor-panel rounded-panel border border-line bg-surface p-6 sm:p-10">
          <h1 className="visitor-heading text-[length:var(--vt-h1)] font-semibold tracking-[-.045em]">{isEnglish ? "Page settings" : "Sayfa ayarları"}</h1>
          <div className="mt-8 divide-y divide-line">
            {rows.map((row) => (
              <div key={row.title} className="flex flex-col items-stretch gap-3 py-6 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <strong className="visitor-copy block text-[length:var(--vt-small)] font-semibold">{row.title}</strong>
                  <p className="visitor-muted mt-1 text-[length:var(--vt-ui)] leading-6 text-muted">{row.description}</p>
                </div>
                {row.control}
              </div>
            ))}
          </div>
        </section>
      </main>
    </VisitorShell>
  );
}
