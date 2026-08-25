import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { VisitorContentPage } from "@/components/features/visitor/visitor-content-page";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";
import type { ReactNode } from "react";

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

/** Each block of the page carries the same eyebrow-over-content shape, separated by a hairline. */
function Section({ title, children, first }: { title: string; children: ReactNode; first?: boolean }) {
  return (
    <section className={first ? "" : "mt-9 border-t border-line pt-8 sm:mt-10 sm:pt-9"} aria-label={title}>
      <h2 className="visitor-muted text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.16em] text-faint">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
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
      <VisitorContentPage
        title={isEnglish ? "About" : "Hakkında"}
        intro={isEnglish
          ? "A closer look at diji.news and the thinking behind the feed."
          : "diji.news'i ve akışın arkasındaki yaklaşımı daha yakından tanıyın."}
      >
        <Section title={isEnglish ? "What we do" : "Ne yapıyoruz"} first>
          <div className="space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 24)}-${index}`} className="visitor-copy text-[length:var(--vt-lead)] font-normal leading-[1.7] tracking-[-.018em] text-ink [text-wrap:pretty]">{paragraph}</p>
            ))}
          </div>
        </Section>

        <Section title={isEnglish ? "Follow the feed" : "Akışı takip edin"}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="visitor-muted text-[length:var(--vt-ui)] leading-6 text-muted [text-wrap:pretty]">
              {isEnglish ? "Every note, directly in your RSS reader." : "Her not doğrudan RSS okuyucunuza gelsin."}
            </p>
            <a href={rssHref} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-[length:var(--vt-ui)] font-semibold text-ink shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft">
              <Rss className="size-4" aria-hidden="true" />RSS
            </a>
          </div>
        </Section>
      </VisitorContentPage>
    </VisitorShell>
  );
}
