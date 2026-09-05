import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const title = isEnglish ? "About" : "Hakkında";
  const description = isEnglish ? settings.descriptionEn : settings.description;
  return {
    title: { absolute: `${title} · ${settings.siteName}` },
    description,
    alternates: { canonical: languageHref("/about", language), languages: { tr: "/about", en: "/about?lang=en", "x-default": "/about" }, types: { "application/rss+xml": languageHref("/feed.xml", language) } },
    openGraph: { type: "website", siteName: settings.siteName, title: `${title} · ${settings.siteName}`, description, url: languageHref("/about", language), locale: isEnglish ? "en_US" : "tr_TR" },
    twitter: { card: "summary", title: `${title} · ${settings.siteName}`, description },
  };
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="mt-10 w-full max-w-[640px] sm:mt-14">
        <div className="mb-8 border-b border-line pb-5">
          <h1 className="visitor-copy visitor-serif text-[26px] font-normal leading-[1.3] tracking-normal text-ink sm:text-[30px]">{isEnglish ? "About" : "Hakkında"}</h1>
          <p className="mt-2 font-mono text-[11px] font-normal uppercase leading-none tracking-[.12em] text-muted">
            {isEnglish ? "The calm flow of the digital world" : "Dijital dünyanın sakin akışı"}
          </p>
        </div>
        <div className="visitor-card px-5 py-5 sm:px-6 sm:py-6">
          <section aria-labelledby="about-purpose">
            <h2 id="about-purpose" className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-accent sm:text-[11px]">
              {isEnglish ? "What is it?" : "Nedir?"}
            </h2>
            <div className="visitor-copy visitor-serif mt-4 space-y-5 text-[18px] font-normal leading-[1.55] tracking-[-.01em] text-ink [text-wrap:pretty] sm:text-[21px] sm:leading-[1.55]">
              {isEnglish ? (
                <>
                  <p>We turn important developments in technology, AI, science, and digital culture into <strong className="font-semibold">short, sourced notes</strong>.</p>
                  <p><strong className="font-semibold">dijitalmasallar.com</strong> is an independent publishing project by <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-semibold text-accent transition-colors hover:text-ink">Temha Angelio</a>.</p>
                  <p>Share questions, suggestions, and corrections at <a href="mailto:temhaangelio@gmail.com" className="font-semibold text-accent transition-colors hover:text-ink">temhaangelio@gmail.com</a>.</p>
                </>
              ) : (
                <>
                  <p>Teknoloji, yapay zekâ, bilim ve dijital kültürdeki önemli gelişmeleri <strong className="font-semibold">kısa, kaynaklı notlara</strong> dönüştürüyoruz.</p>
                  <p><strong className="font-semibold">dijitalmasallar.com</strong>, <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-semibold text-accent transition-colors hover:text-ink">Temha Angelio</a> tarafından geliştirilen bağımsız bir yayın projesidir.</p>
                  <p>Soru, öneri ve düzeltmelerinizi <a href="mailto:temhaangelio@gmail.com" className="font-semibold text-accent transition-colors hover:text-ink">temhaangelio@gmail.com</a> ile paylaşabilirsiniz.</p>
                </>
              )}
            </div>
          </section>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center font-mono text-[11px] font-normal tracking-[.08em] text-accent">
          <Heart className="size-3 fill-current" strokeWidth={1.8} aria-hidden="true" />
          {isEnglish ? "Made with love in Bursa." : "Bursa’da sevgiyle üretiliyor."}
        </p>
      </main>
    </VisitorShell>
  );
}
