import type { Metadata } from "next";
import { FontPicker, FontSizePicker } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Sayfa ayarları" };

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
      <main className="w-full max-w-[720px] pb-10 pt-14 sm:pt-20"><section className="visitor-panel rounded-panel bg-surface p-6 sm:p-10"><h1 className="visitor-heading text-[32px] font-semibold tracking-[-.045em] sm:text-[40px]">{isEnglish ? "Page settings" : "Sayfa ayarları"}</h1><div className="mt-8 divide-y divide-line">{rows.map((row) => <div key={row.title} className="flex flex-col gap-4 py-6 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8"><div className="min-w-0"><strong className="visitor-copy block text-[15px]">{row.title}</strong><p className="visitor-muted mt-1 text-sm leading-6 text-muted">{row.description}</p></div>{row.control}</div>)}</div></section></main>
    </VisitorShell>
  );
}
