import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bookmark, Heart, Mail, Rss, Smartphone } from "lucide-react";
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

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="visitor-wide-page mt-6 w-full max-w-[640px] sm:mt-9">
        <header className="mb-6">
          <h1 className="visitor-serif text-[28px] leading-tight text-ink sm:text-[32px]">{isEnglish ? "About" : "Hakkında"}</h1>
        </header>
        <div className="visitor-card visitor-about-card">
          <section className="visitor-about-profile" aria-labelledby="about-author">
            <div className="visitor-about-portrait">
              <Image
                src="/about-illustration-logo.png"
                alt={isEnglish ? "An illustrated presenter with a microphone and laptop" : "Mikrofon ve dizüstü bilgisayarla bir sunucu illüstrasyonu"}
                width={1254}
                height={1254}
                sizes="(max-width: 359px) 88px, (max-width: 639px) 112px, (min-width: 1280px) 176px, 144px"
                priority
                className="block h-auto w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 id="about-author" className="visitor-about-author visitor-sans">
                Temha Angelio
              </h2>
              <p className="visitor-about-copy visitor-copy visitor-serif mt-2">
                {isEnglish
                  ? "The author of this independent microblog, published in Turkish and English."
                  : "Türkçe ve İngilizce yayımlanan bu bağımsız mikroblogun yazarı."}
              </p>
            </div>
            <a href="https://www.temhaangelio.com/" target="_blank" rel="noopener noreferrer" className="visitor-about-website visitor-sans">
              <span>https://www.temhaangelio.com/</span>
              <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true" />
            </a>
          </section>
          <div className="visitor-about-sections">
            <section aria-labelledby="about-reading">
              <h2 id="about-reading" className="visitor-about-section-title visitor-sans">{isEnglish ? "Follow and save" : "Takip et, sonra oku"}</h2>
              <p className="visitor-about-copy visitor-copy visitor-serif mt-2">{isEnglish
                ? "Follow the feed via RSS and save notes to read later. Your favorites stay in this browser."
                : "Akışı RSS ile takip et, dönmek istediğin notları favorilerine kaydet. Favorilerin bu tarayıcıda saklanır."}</p>
              <div className="visitor-about-actions visitor-sans">
                <a href={languageHref("/feed.xml", language)} className="visitor-about-action"><Rss size={17} strokeWidth={1.6} aria-hidden="true" />{isEnglish ? "RSS feed" : "RSS akışı"}</a>
                <Link href={languageHref("/favoriler", language)} className="visitor-about-action"><Bookmark size={17} strokeWidth={1.6} aria-hidden="true" />{isEnglish ? "Favorites" : "Favoriler"}</Link>
              </div>
            </section>
            <section className="visitor-about-app" aria-labelledby="about-app">
              <h2 id="about-app" className="visitor-about-section-title visitor-sans"><Smartphone size={18} strokeWidth={1.6} aria-hidden="true" />{isEnglish ? "One tap away" : "Bir dokunuş uzağında"}</h2>
              <p className="visitor-about-copy visitor-copy visitor-serif mt-2">{isEnglish
                ? "Add Dijital Masallar to your home screen and open it like an app. No app store download needed."
                : "Dijital Masallar’ı ana ekranına ekleyip uygulama gibi açabilirsin. Mağazadan indirmen gerekmez."}</p>
              <p className="visitor-about-hint visitor-sans">{isEnglish
                ? "Settings → More settings → Add to home screen"
                : "Ayarlar → Diğer ayarlar → Ana ekrana ekle"}</p>
            </section>
          </div>
          <div className="visitor-about-contact visitor-sans">
            <div>
              <p className="text-[13px] text-muted">{isEnglish ? "Suggestions, corrections, or a hello" : "Öneri, düzeltme ya da bir merhaba"}</p>
              <a href={`mailto:${settings.contactEmail}`} className="inline-flex min-h-11 min-w-0 items-center gap-2 text-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent">
                <Mail className="size-4 shrink-0 text-muted" strokeWidth={1.6} aria-hidden="true" />
                <span className="break-all">{settings.contactEmail}</span>
              </a>
            </div>
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
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted">
          <Heart className="size-3.5" aria-hidden="true" />
          {isEnglish ? "Made with love in Bursa." : "Bursa’da sevgiyle üretiliyor."}
        </p>
      </main>
    </VisitorShell>
  );
}
