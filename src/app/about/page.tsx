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
              {isEnglish ? "What is it?" : "Nedir?"}
            </h2>
            <p className="visitor-copy visitor-serif mt-4 text-[19px] font-normal leading-[1.58] tracking-[-.01em] text-ink sm:text-[22px] sm:leading-[1.6]">
              {isEnglish
                ? <>We turn important developments in technology, AI, science, and digital culture into <strong className="font-semibold">short, sourced notes</strong>. <strong className="font-semibold">diji.news</strong> is an independent publishing project by <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-semibold text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">Temha Angelio</a>. Share questions, suggestions, and corrections at <a href="mailto:temhaangelio@gmail.com" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio@gmail.com</a>.</>
                : <>Teknoloji, yapay zekâ, bilim ve dijital kültürdeki önemli gelişmeleri <strong className="font-semibold">kısa, kaynaklı notlara</strong> dönüştürüyoruz. <strong className="font-semibold">diji.news</strong>, <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-semibold text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">Temha Angelio</a> tarafından geliştirilen bağımsız bir yayın projesidir. Soru, öneri ve düzeltmelerinizi <a href="mailto:temhaangelio@gmail.com" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio@gmail.com</a> ile paylaşabilirsiniz.</>}
            </p>
          </section>
        </div>
      </VisitorContentPage>
    </VisitorShell>
  );
}
