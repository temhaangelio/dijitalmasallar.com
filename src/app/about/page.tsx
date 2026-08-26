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
        <div className="space-y-5">
          {isEnglish ? (
            <>
              <p className="visitor-copy text-[16px] font-normal leading-[1.6] tracking-normal text-ink sm:text-[18px] sm:leading-[1.65]">
                We follow developments in technology, artificial intelligence, science, and digital culture, turning notable stories into <strong className="font-semibold">short notes with source links</strong> using AI support. Our goal is to help you catch up on the news in just a few minutes without feeling overwhelmed.
              </p>
              <p className="visitor-copy text-[16px] font-normal leading-[1.6] tracking-normal text-ink sm:text-[18px] sm:leading-[1.65]">
                <strong className="font-semibold">diji.news</strong> is an independent publishing project developed by Temha Angelio, who has worked in technology and digital production for nearly 20 years. For other work, visit{" "}
                <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio.com</a>.
              </p>
              <p className="visitor-copy text-[16px] font-normal leading-[1.6] tracking-normal text-ink sm:text-[18px] sm:leading-[1.65]">
                For questions, suggestions, and corrections:{" "}
                <a href="mailto:temhaangelio@gmail.com" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio@gmail.com</a>
              </p>
            </>
          ) : (
            <>
              <p className="visitor-copy text-[16px] font-normal leading-[1.6] tracking-normal text-ink sm:text-[18px] sm:leading-[1.65]">
                Teknoloji, yapay zekâ, bilim ve dijital kültürdeki gelişmeleri takip ediyor, öne çıkan haberleri yapay zeka desteği ile <strong className="font-semibold">kısa ve kaynak bağlantılı notlara</strong> dönüştürüyoruz. Amacımız, gündemi yorulmadan birkaç dakikada yakalamanızı sağlamak.
              </p>
              <p className="visitor-copy text-[16px] font-normal leading-[1.6] tracking-normal text-ink sm:text-[18px] sm:leading-[1.65]">
                <strong className="font-semibold">diji.news</strong>, yaklaşık 20 yıldır teknoloji ve dijital üretim alanlarında çalışan Temha Angelio tarafından geliştirilen bağımsız bir yayın projesidir. Diğer çalışmalar için{" "}
                <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio.com</a> adresini ziyaret edebilirsiniz.
              </p>
              <p className="visitor-copy text-[16px] font-normal leading-[1.6] tracking-normal text-ink sm:text-[18px] sm:leading-[1.65]">
                Soru, öneri ve düzeltmeleriniz için:{" "}
                <a href="mailto:temhaangelio@gmail.com" className="font-medium text-accent underline decoration-accent/35 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">temhaangelio@gmail.com</a>
              </p>
            </>
          )}
        </div>
      </VisitorContentPage>
    </VisitorShell>
  );
}
