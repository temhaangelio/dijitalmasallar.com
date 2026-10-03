import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bookmark, Heart, Mail, Rss, Smartphone } from "lucide-react";
import { VisitorPageHeading } from "@/components/features/visitor/page-heading";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

/** Lucide carries no brand marks, so Instagram's is drawn here and shared by the two places that use it. */
function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

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
      <main className="feed-column feed-page w-full">
        <VisitorPageHeading title={isEnglish ? "About" : "Hakkında"} />

        <section className="feed-about-profile" aria-labelledby="about-author">
          <div className="feed-about-portrait">
            <Image
              src="/about-illustration-logo.png"
              alt={isEnglish ? "An illustrated presenter with a microphone and laptop" : "Mikrofon ve dizüstü bilgisayarla bir sunucu illüstrasyonu"}
              width={1254}
              height={1254}
              sizes="(max-width: 639px) 96px, 120px"
              priority
              className="block h-auto w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 id="about-author" className="feed-about-author visitor-sans">Temha Angelio</h2>
            <p className="feed-about-role visitor-sans">{isEnglish ? "Founder and editor of Dijital Masallar." : "Dijital Masallar’ın kurucusu ve editörü."}</p>
            <div className="feed-about-links visitor-sans">
              <a href="https://www.instagram.com/temhaangelio" target="_blank" rel="noopener noreferrer" className="feed-about-link">
                <InstagramGlyph size={14} />
                <span>{isEnglish ? "Daily videos on Instagram" : "Günlük videolar Instagram’da"}</span>
              </a>
              <a href="https://www.temhaangelio.com/" target="_blank" rel="noopener noreferrer" className="feed-about-link">
                <span>temhaangelio.com</span>
                <ArrowUpRight size={13} strokeWidth={1.7} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="feed-about-section" aria-labelledby="about-what">
          <h2 id="about-what" className="feed-about-section-title visitor-sans">{isEnglish ? "How it works" : "Nasıl çalışır?"}</h2>
          <p className="feed-about-copy visitor-copy visitor-sans">{isEnglish
            ? "AI follows the technology, artificial intelligence, science and digital culture agenda using official sources only, summarises it and turns it into short news notes. No clickbait: a plain design, easy reading and few ads let you catch up on the day quickly."
            : "Teknoloji, yapay zekâ, bilim ve dijital kültür gündemini yapay zekâ yalnızca resmî kaynaklardan buluyor, özetliyor ve kısa haber notlarına dönüştürüyor. Clickbait yok; sade tasarım, kolay okuma ve az reklamla gündemi hızlıca takip edebilirsiniz."}</p>
        </section>

        <section className="feed-about-section" aria-labelledby="about-reading">
          <h2 id="about-reading" className="feed-about-section-title visitor-sans">{isEnglish ? "Follow, read later" : "Takip et, sonra oku"}</h2>
          <p className="feed-about-copy visitor-copy visitor-sans">{isEnglish
            ? "Follow the feed via RSS and save notes to read later. Your favorites stay in this browser."
            : "Akışı RSS ile takip et, dönmek istediğin notları favorilerine kaydet. Favorilerin bu tarayıcıda saklanır."}</p>
          <div className="feed-about-actions visitor-sans">
            <a href={languageHref("/feed.xml", language)} className="feed-about-action"><Rss size={15} strokeWidth={1.7} aria-hidden="true" />{isEnglish ? "RSS feed" : "RSS akışı"}</a>
            <Link href={languageHref("/favoriler", language)} className="feed-about-action"><Bookmark size={15} strokeWidth={1.7} aria-hidden="true" />{isEnglish ? "Favorites" : "Favoriler"}</Link>
          </div>
        </section>

        <section className="feed-about-section" aria-labelledby="about-app">
          <h2 id="about-app" className="feed-about-section-title visitor-sans">{isEnglish ? "One tap away" : "Bir dokunuş uzağında"}</h2>
          <p className="feed-about-copy visitor-copy visitor-sans">{isEnglish
            ? "Dijital Masallar is a PWA (Progressive Web App): a website that installs like an app. Add it to your home screen and it opens full-screen with its own icon, loads fast and can send notifications. No app store download needed."
            : "Dijital Masallar bir PWA (Progressive Web App), yani uygulama gibi yüklenebilen bir web sitesi. Ana ekranına eklediğinde kendi simgesiyle tam ekran açılır, hızlı yüklenir ve bildirim gönderebilir. Mağazadan indirmen gerekmez."}</p>
          <p className="feed-about-hint visitor-sans"><Smartphone size={14} strokeWidth={1.7} aria-hidden="true" />{isEnglish
            ? "Menu → Settings → Home screen"
            : "Menü → Ayarlar → Ana ekran"}</p>
        </section>

        <section className="feed-about-section feed-about-contact visitor-sans" aria-labelledby="about-contact">
          <h2 id="about-contact" className="feed-about-section-title">{isEnglish ? "Suggestions, corrections, or a hello" : "Öneri, düzeltme ya da bir merhaba"}</h2>
          <a href={`mailto:${settings.contactEmail}`} className="feed-about-mail">
            <Mail className="size-4 shrink-0 text-muted" strokeWidth={1.6} aria-hidden="true" />
            <span className="break-all">{settings.contactEmail}</span>
          </a>
          <nav className="feed-about-social" aria-label={isEnglish ? "Social media" : "Sosyal medya"}>
            <a href="https://www.instagram.com/temhaangelio" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha Angelio on Instagram (opens in a new tab)" : "Temha Angelio Instagram profili (yeni sekmede açılır)"} title="Instagram · @temhaangelio" className="feed-about-social-link">
              <InstagramGlyph />
            </a>
            <a href="https://www.threads.com/@temhaangelio" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha Angelio on Threads (opens in a new tab)" : "Temha Angelio Threads profili (yeni sekmede açılır)"} title="Threads · @temhaangelio" className="feed-about-social-link">
              <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 7.5C18.8 3.8 16.1 2 12.2 2 6.2 2 3 5.8 3 12s3.2 10 9.2 10c5.2 0 8.8-2.8 8.8-6.5 0-3.5-3.2-5.6-7.7-5.6-3.2 0-5.2 1.5-5.2 3.6 0 1.8 1.4 3 3.4 3 3.1 0 4.7-2.3 4.7-5.8 0-3-1.5-4.7-4-4.7-1.6 0-2.9.7-3.8 1.9" />
              </svg>
            </a>
            <a href="https://x.com/temha" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha on X (opens in a new tab)" : "Temha X profili (yeni sekmede açılır)"} title="X · @temha" className="feed-about-social-link">
              <svg className="size-[16px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" />
              </svg>
            </a>
            <a href="https://www.youtube.com/temhaangelio" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha Angelio on YouTube (opens in a new tab)" : "Temha Angelio YouTube kanalı (yeni sekmede açılır)"} title="YouTube · Temha Angelio" className="feed-about-social-link">
              <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="4" />
                <path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </nav>
        </section>

        <p className="feed-about-made visitor-sans">
          <Heart className="size-3.5" aria-hidden="true" />
          {isEnglish ? "Made with love in Bursa." : "Bursa’da sevgiyle üretiliyor."}
        </p>
      </main>
    </VisitorShell>
  );
}
