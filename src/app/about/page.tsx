import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart, Mail } from "lucide-react";
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
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const link = "font-medium underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4";

  return (
    <VisitorShell language={language} siteName={settings.siteName} compact>
      <main className="mt-6 w-full max-w-[640px] sm:mt-9">
        <header className="mb-6">
          <h1 className="visitor-serif text-[28px] leading-tight text-ink sm:text-[32px]">{isEnglish ? "About" : "Hakkında"}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{isEnglish ? "A small window into the digital world." : "Dijital dünyaya küçük bir pencere."}</p>
        </header>
        <div className="visitor-card px-5 py-6 sm:px-7 sm:py-7">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[176px_minmax(0,1fr)] md:items-center md:gap-7">
          <p className="visitor-copy visitor-serif min-w-0 md:col-start-2 md:row-start-1 text-[23px] leading-[1.5] text-ink sm:text-[26px]">
            {isEnglish
              ? "Short, sourced notes on technology, artificial intelligence, science and digital culture."
              : "Teknoloji, yapay zekâ, bilim ve dijital kültür üzerine kısa, kaynaklı notlar."}
          </p>
          <div className="aspect-square w-36 justify-self-center sm:w-40 md:col-start-1 md:row-start-1 md:w-44">
          <Image
            src="/about-illustration.png"
            alt={isEnglish ? "An illustrated presenter with a microphone and laptop" : "Mikrofon ve dizüstü bilgisayarla bir sunucu illüstrasyonu"}
            width={1254}
            height={1254}
            sizes="(max-width: 639px) 144px, (max-width: 767px) 160px, 176px"
            priority
            className="block h-auto w-full object-contain"
          />

          </div>
          </div>
          <div className="visitor-copy visitor-serif mt-6 text-[18px] leading-[1.65] text-ink-2">
            <p>{isEnglish
              ? <>An independent microblog by <a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className={link}>Temha Angelio</a>, published in Turkish and English.</>
              : <><a href="https://www.temhaangelio.com/" target="_blank" rel="noreferrer" className={link}>Temha Angelio</a> tarafından Türkçe ve İngilizce yayımlanan bağımsız bir mikroblog.</>}{" "}{isEnglish
              ? <>Follow via <a href={languageHref("/feed.xml", language)} className={link}>RSS</a> or save notes to <Link href={languageHref("/favoriler", language)} className={link}>Favorites</Link> to read later. Saved notes stay in this browser.</>
              : <><a href={languageHref("/feed.xml", language)} className={link}>RSS</a> ile takip et, sonra okumak istediklerini <Link href={languageHref("/favoriler", language)} className={link}>Favoriler</Link>’e kaydet. Kaydettiğin notlar bu tarayıcıda saklanır.</>}</p>
          </div>
          <div className="mt-7 border-t border-line pt-5">
            <p className="text-xs font-medium text-muted">{isEnglish ? "Suggestions, corrections, or a hello" : "Öneri, düzeltme ya da bir merhaba"}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <a href={`mailto:${settings.contactEmail}`} className="inline-flex min-h-11 min-w-0 items-center gap-2 text-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent">
              <Mail className="size-4 shrink-0 text-muted" strokeWidth={1.6} aria-hidden="true" />
              <span className="break-all">{settings.contactEmail}</span>
            </a>
      <nav className="flex flex-wrap items-center gap-1" aria-label={isEnglish ? "Social media" : "Sosyal medya"}>
      <a
        href="https://www.instagram.com/temhaangelio"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === "en" ? "Temha Angelio on Instagram (opens in a new tab)" : "Temha Angelio Instagram profili (yeni sekmede açılır)"}
        title="Instagram · @temhaangelio"
        className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span className="sr-only">Instagram</span>
      </a>
      <a
        href="https://www.threads.com/@temhaangelio"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === "en" ? "Temha Angelio on Threads (opens in a new tab)" : "Temha Angelio Threads profili (yeni sekmede açılır)"}
        title="Threads · @temhaangelio"
        className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 7.5C18.8 3.8 16.1 2 12.2 2 6.2 2 3 5.8 3 12s3.2 10 9.2 10c5.2 0 8.8-2.8 8.8-6.5 0-3.5-3.2-5.6-7.7-5.6-3.2 0-5.2 1.5-5.2 3.6 0 1.8 1.4 3 3.4 3 3.1 0 4.7-2.3 4.7-5.8 0-3-1.5-4.7-4-4.7-1.6 0-2.9.7-3.8 1.9" />
        </svg>
        <span className="sr-only">Threads</span>
      </a>
      <a
        href="https://x.com/temha"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === "en" ? "Temha on X (opens in a new tab)" : "Temha X profili (yeni sekmede açılır)"}
        title="X · @temha"
        className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" />
        </svg>
        <span className="sr-only">X</span>
      </a>
      <a
        href="https://www.youtube.com/temhaangelio"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === "en" ? "Temha Angelio on YouTube (opens in a new tab)" : "Temha Angelio YouTube kanalı (yeni sekmede açılır)"}
        title="YouTube · Temha Angelio"
        className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="4" />
          <path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" />
        </svg>
        <span className="sr-only">YouTube</span>
      </a>
      </nav>
            </div>
          </div>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted">
          <Heart className="size-3.5" aria-hidden="true" />
          {isEnglish ? "Made with love in Bursa." : "Bursa’da sevgiyle üretiliyor."}
        </p>
      </main>
    </VisitorShell>
  );
}
