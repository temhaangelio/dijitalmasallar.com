import type { Metadata } from "next";
import { Headphones } from "lucide-react";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { AudioPlaylist } from "@/components/features/visitor/audio-playlist";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getPublishedAudioQueue } from "@/services/daily-audio";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; day?: string; play?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  return {
    title: "Podcast",
    description: language === "en" ? "Listen to the daily technology briefings from Dijital Masallar." : "Dijital Masallar’ın günlük teknoloji bültenlerini dinleyin.",
    alternates: { canonical: languageHref("/podcast", language), languages: { tr: languageHref("/podcast", "tr"), en: languageHref("/podcast", "en") } },
  };
}

export default async function ListenPage({ searchParams }: Props) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const english = language === "en";
  const [settings, result] = await Promise.all([getSiteSettings(), getPublishedAudioQueue(language)]);
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="visitor-wide-page visitor-sans listen-page mt-6 w-full !max-w-[1000px] sm:mt-9">
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-7">
            <h1 className="text-xl font-semibold tracking-tight">Podcast</h1>
          <LanguagePicker language={language} path="/podcast" />
        </header>
        {result.error ? <p role="alert" className="visitor-card p-5 text-sm text-danger">{english ? "Recordings could not be loaded. Please try again." : "Kayıtlar yüklenemedi. Lütfen yeniden deneyin."}</p>
          : result.items.length ? <AudioPlaylist key={`${language}-${query.day ?? ""}-${query.play ?? ""}`} items={result.items} language={language} initialDay={query.day} autoPlay={query.play === "1" && result.items.some(item => item.day === query.day)} />
            : <div className="visitor-card px-6 py-10 text-center"><Headphones className="mx-auto mb-3 size-8 text-muted" aria-hidden="true" /><p className="text-sm text-muted">{english ? "No published recordings on this page yet." : "Bu sayfada henüz yayımlanmış ses kaydı yok."}</p></div>}
      </main>
    </VisitorShell>
  );
}
