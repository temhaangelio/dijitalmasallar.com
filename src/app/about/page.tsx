import type { Metadata } from "next";
import Image from "next/image";
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

/**
 * The about page as a few plain lines: what the site is, who makes it, where to find him, how to
 * write. No cards, icons or sections — it is a note about the notes, and reads like one.
 */
export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const links = [
    { href: "https://www.instagram.com/temhaangelio", label: "Instagram" },
    { href: "https://www.youtube.com/temhaangelio", label: "YouTube" },
    { href: "https://www.threads.com/@temhaangelio", label: "Threads" },
    { href: "https://x.com/temha", label: "X" },
    { href: "https://www.temhaangelio.com/", label: "temhaangelio.com" },
  ];

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="visitor-about visitor-sans mt-8 w-full max-w-[560px] sm:mt-12">
        <h1 className="visitor-about-title">{isEnglish ? "About" : "Hakkında"}</h1>
        <p>{isEnglish
          ? "Dijital Masallar turns the day's technology, AI, science and digital culture news into short notes, from official sources only."
          : "Dijital Masallar, teknoloji, yapay zekâ, bilim ve dijital kültür gündemini yalnızca resmî kaynaklardan derleyip kısa notlara dönüştürür."}</p>
        <p>{isEnglish ? "No clickbait, few ads — just the news." : "Clickbait yok, reklam az; sadece haber."}</p>

        <div className="visitor-about-person">
          <Image src="/about-illustration-logo.png" alt="" width={1254} height={1254} sizes="56px" priority className="visitor-about-avatar" />
          <p><strong>Temha Angelio</strong><br />{isEnglish ? "Founder and editor" : "Kurucu ve editör"}</p>
        </div>

        <p className="visitor-about-links">
          {links.map((link, index) => <span key={link.href}>{index ? <span aria-hidden="true"> · </span> : null}<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></span>)}
        </p>
        <p className="visitor-about-contact">
          {isEnglish ? "Write to " : "Yazmak için: "}<a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </p>
      </main>
    </VisitorShell>
  );
}
