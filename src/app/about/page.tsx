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

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="w-full max-w-[720px] pb-10 pt-14 sm:pt-20">
        <section className="visitor-panel rounded-panel bg-surface p-6 sm:p-10">
          <p className="visitor-muted text-[11px] font-bold uppercase tracking-[.14em] text-muted">{isEnglish ? "About us" : "Biz kimiz"}</p>
          <h1 className="visitor-heading mt-4 text-[32px] font-semibold leading-tight tracking-[-.045em] sm:text-[40px]">{isEnglish ? "About" : "Hakkında"}</h1>
          <p className="visitor-copy mt-7 max-w-[620px] text-[18px] leading-8 text-ink [text-wrap:pretty]">{about}</p>
          <div className="mt-10 border-t border-line pt-7">
            <h2 className="visitor-heading text-[18px] font-semibold">RSS</h2>
            <p className="visitor-copy mt-2 max-w-[560px] text-[15px] leading-7 text-muted">{isEnglish ? "Follow every note in your preferred RSS reader." : "Tüm notları tercih ettiğiniz RSS okuyucusundan takip edin."}</p>
            <a href={rssHref} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-5 text-sm font-semibold text-ink transition-colors hover:bg-line"><Rss className="size-4" aria-hidden="true" />{settings.domain}{rssHref}</a>
          </div>
        </section>
      </main>
    </VisitorShell>
  );
}
