import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return {
    title: { absolute: `${isEnglish ? "About" : "Hakkında"} · ${settings.siteName}` },
    description: isEnglish ? settings.descriptionEn : settings.description,
    alternates: { canonical: languageHref("/about", language), languages: { en: "/about", tr: "/about?lang=tr", "x-default": "/about" } },
  };
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const rssHref = isEnglish ? "/rss.xml" : "/rss.xml?lang=tr";
  const about = isEnglish ? settings.aboutTextEn || settings.descriptionEn : settings.aboutText || settings.description;
  const paragraphs = about.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pb-14 pt-12 sm:pb-20 sm:pt-20">
        <article>
          <header className="relative border-b border-line-strong pb-10 sm:pb-14">
            <h1 className="visitor-heading max-w-[650px] text-[52px] font-semibold leading-[.95] tracking-[-.065em] sm:text-[76px]">{isEnglish ? "About" : "Hakkında"}</h1>
          </header>

          <section className="grid gap-8 border-b border-line-strong py-10 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-12 sm:py-14" aria-label={isEnglish ? "About diji.news" : "diji.news hakkında"}>
            <p className="visitor-muted pt-1 text-[11px] font-bold uppercase tracking-[.16em] text-muted">{isEnglish ? "What we do" : "Ne yapıyoruz"}</p>
            <div className="space-y-6">
              {paragraphs.map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 24)}-${index}`} className="visitor-copy text-[20px] font-normal leading-[1.75] tracking-[-.018em] text-ink [text-wrap:pretty] sm:text-[22px]">{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10" aria-labelledby="about-rss-title">
            <div>
              <h2 id="about-rss-title" className="visitor-heading text-[18px] font-semibold tracking-[-.025em]">{isEnglish ? "Follow the feed" : "Akışı takip edin"}</h2>
              <p className="visitor-muted mt-1.5 text-sm leading-6 text-muted">{isEnglish ? "Every note, directly in your RSS reader." : "Her not doğrudan RSS okuyucunuza gelsin."}</p>
            </div>
            <a href={rssHref} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-semibold text-ink shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft"><Rss className="size-4" aria-hidden="true" />RSS</a>
          </section>
        </article>
      </main>
    </VisitorShell>
  );
}
