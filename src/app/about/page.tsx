import type { Metadata } from "next";
import { VisitorContentPage } from "@/components/features/visitor/visitor-content-page";
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

  return (
    <VisitorShell language={language} siteName={settings.siteName} showHeader={false}>
      <VisitorContentPage
        title={isEnglish ? "About" : "Hakkında"}
        homeHref={languageHref("/", language)}
        homeLabel={isEnglish ? `${settings.siteName} home` : `${settings.siteName} ana sayfa`}
        intro={isEnglish
          ? "The calm flow of the digital world."
          : "Dijital dünyanın sakin akışı."}
      >
        <div>
          <section aria-labelledby="about-purpose">
            <h2 id="about-purpose" className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-accent sm:text-[11px]">
              {isEnglish ? "What we do" : "Ne yapıyoruz"}
            </h2>
            <p className="visitor-copy visitor-serif mt-4 text-[19px] font-normal leading-[1.58] tracking-[-.01em] text-ink sm:text-[22px] sm:leading-[1.6]">
              {isEnglish
                ? <>We follow technology, artificial intelligence, science, and digital culture, turning what matters into <strong className="font-semibold">short notes with clear source links</strong>. The aim is simple: help you catch up in a few calm minutes, without the noise.</>
                : <>Teknoloji, yapay zekâ, bilim ve dijital kültürü takip ediyor; önemli gelişmeleri <strong className="font-semibold">kısa, anlaşılır ve kaynak bağlantılı notlara</strong> dönüştürüyoruz. Amacımız basit: gündemi gürültüye kapılmadan, sakin birkaç dakika içinde yakalamanızı sağlamak.</>}
            </p>
          </section>

          <section aria-labelledby="about-project" className="mt-9 grid gap-4 border-t border-line pt-8 sm:mt-11 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8 sm:pt-9">
            <h2 id="about-project" className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-muted sm:pt-1 sm:text-[11px]">
              {isEnglish ? "The project" : "Proje"}
            </h2>
            <p className="visitor-copy visitor-serif text-[19px] font-normal leading-[1.58] tracking-[-.01em] text-ink sm:text-[22px] sm:leading-[1.6]">
              {isEnglish
                ? <><strong className="font-semibold">diji.news</strong> is an independent publishing project by Temha Angelio, built on nearly 20 years of work in technology and digital production. Explore other work at{" "}<a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio.com ↗</a>.</>
                : <><strong className="font-semibold">diji.news</strong>, teknoloji ve dijital üretim alanlarındaki yaklaşık 20 yıllık deneyimin ardından Temha Angelio tarafından geliştirilen bağımsız bir yayın projesidir. Diğer çalışmalar için{" "}<a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio.com ↗</a>.</>}
            </p>
          </section>

          <section aria-labelledby="about-contact" className="mt-8 grid gap-4 border-t border-line pt-8 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8">
            <h2 id="about-contact" className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-muted sm:pt-1 sm:text-[11px]">
              {isEnglish ? "Contact" : "İletişim"}
            </h2>
            <div>
              <p className="visitor-copy visitor-serif text-[19px] font-normal leading-[1.58] tracking-[-.01em] text-ink sm:text-[22px] sm:leading-[1.6]">{isEnglish ? "Questions, suggestions, or corrections are always welcome." : "Soru, öneri ve düzeltmelerinizi her zaman paylaşabilirsiniz."}</p>
              <a href="mailto:temhaangelio@gmail.com" className="visitor-copy visitor-serif mt-3 inline-block text-[19px] font-medium leading-[1.58] tracking-[-.01em] text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink sm:text-[22px] sm:leading-[1.6]">temhaangelio@gmail.com ↗</a>
            </div>
          </section>
        </div>
      </VisitorContentPage>
    </VisitorShell>
  );
}
