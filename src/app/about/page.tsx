import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bookmark, Headphones, Mail, Rss, Smartphone } from "lucide-react";
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

  const monthYear = new Intl.DateTimeFormat(isEnglish ? "en-US" : "tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date());
  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="feed-column feed-page w-full">
        <VisitorPageHeading title={isEnglish ? "About" : "Hakkında"} />

        {/* A letter to the reader: a dateline, a greeting, a few paragraphs, a signature, a postscript. */}
        <article className="feed-letter">
          <p className="feed-letter-dateline visitor-sans">{isEnglish ? `Bursa, ${monthYear}` : `Bursa, ${monthYear}`}</p>
          <p className="feed-letter-greeting">{isEnglish ? "Dear reader," : "Sevgili okur,"}</p>

          <div className="feed-letter-body">
            <p>{isEnglish
              ? "Dijital Masallar is a small daily: the technology, artificial intelligence, science and digital culture agenda, gathered from official sources only, summarised, and set down as short notes. No clickbait; a plain page, easy reading, few ads — so the day can be caught up on in a few minutes."
              : "Dijital Masallar küçük bir günlük: teknoloji, yapay zekâ, bilim ve dijital kültür gündemi yalnızca resmî kaynaklardan toplanıyor, özetleniyor ve kısa notlar hâlinde yazılıyor. Clickbait yok; sade bir sayfa, kolay okuma, az reklam — gündem birkaç dakikada yakalansın diye."}</p>
            <p>{isEnglish
              ? "The notes arrive through the day. If you would rather not check, the feed can be followed over RSS, a note you want to return to can be saved to your favorites, and the day's notes can be heard as a short podcast or received once a day by e-mail."
              : "Notlar gün boyunca düşer. Bakmak istemezseniz akış RSS ile takip edilebilir, dönmek istediğiniz bir not favorilere kaydedilebilir, günün notları kısa bir podcast olarak dinlenebilir ya da günde bir kez e-postayla alınabilir."}</p>
            <p>{isEnglish
              ? "The site installs like an app, too: add it to your home screen and it opens full-screen from its own icon, loads fast and can send a notification when something matters. No app store needed."
              : "Site uygulama gibi de yüklenir: ana ekranınıza ekleyin, kendi simgesinden tam ekran açılır, hızlı yüklenir ve önemli bir şey olduğunda bildirim gönderebilir. Mağaza gerekmez."}</p>
            <p>{isEnglish
              ? "Suggestions, corrections, or simply a hello are always welcome; the address is below."
              : "Öneri, düzeltme ya da yalnızca bir merhaba her zaman hoş gelir; adres aşağıda."}</p>
          </div>

          <div className="feed-letter-closing">
            <p className="feed-letter-valediction">{isEnglish ? "With love, from Bursa" : "Bursa'dan sevgiyle,"}</p>
            <div className="feed-letter-signature">
              <div className="feed-letter-portrait">
                <Image
                  src="/about-illustration-logo.png"
                  alt={isEnglish ? "An illustrated presenter with a microphone and laptop" : "Mikrofon ve dizüstü bilgisayarla bir sunucu illüstrasyonu"}
                  width={1254}
                  height={1254}
                  sizes="88px"
                  priority
                  className="block h-auto w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="feed-letter-name">Temha Angelio</p>
                <p className="feed-letter-role visitor-sans">{isEnglish ? "Founder and editor of Dijital Masallar" : "Dijital Masallar’ın kurucusu ve editörü"}</p>
                <p className="feed-letter-links visitor-sans">
                  <a href="https://www.instagram.com/temhaangelio" target="_blank" rel="noopener noreferrer"><InstagramGlyph size={14} /><span>{isEnglish ? "Daily videos on Instagram" : "Günlük videolar Instagram’da"}</span></a>
                  <a href="https://www.temhaangelio.com/" target="_blank" rel="noopener noreferrer"><span>temhaangelio.com</span><ArrowUpRight size={13} strokeWidth={1.7} aria-hidden="true" /></a>
                </p>
              </div>
            </div>
          </div>

          <aside className="feed-letter-ps" aria-label={isEnglish ? "Postscript" : "Not"}>
            <p className="feed-letter-ps-label visitor-sans">{isEnglish ? "P.S." : "Not:"}</p>
            <div className="feed-letter-ps-body">
              <p>{isEnglish ? "The practical bits, in one place:" : "İşe yarar bağlantılar, tek yerde:"}</p>
              <div className="feed-about-actions visitor-sans">
                <a href={languageHref("/feed.xml", language)} className="feed-about-action"><Rss size={15} strokeWidth={1.7} aria-hidden="true" />{isEnglish ? "RSS feed" : "RSS akışı"}</a>
                <Link href={languageHref("/favoriler", language)} className="feed-about-action"><Bookmark size={15} strokeWidth={1.7} aria-hidden="true" />{isEnglish ? "Favorites" : "Favoriler"}</Link>
                <Link href={languageHref("/podcast", language)} className="feed-about-action"><Headphones size={15} strokeWidth={1.7} aria-hidden="true" />Podcast</Link>
                <Link href={languageHref("/ebulten", language)} className="feed-about-action"><Mail size={15} strokeWidth={1.7} aria-hidden="true" />{isEnglish ? "Newsletter" : "E-bülten"}</Link>
              </div>
              <p className="feed-about-hint visitor-sans"><Smartphone size={14} strokeWidth={1.7} aria-hidden="true" />{isEnglish ? "Add to home screen: Menu → Home screen → How to add" : "Ana ekrana ekle: Menü → Ana ekran → Nasıl eklenir?"}</p>
              <p className="feed-letter-contact">
                <a href={`mailto:${settings.contactEmail}`} className="feed-about-mail visitor-sans"><Mail className="size-4 shrink-0 text-muted" strokeWidth={1.6} aria-hidden="true" /><span className="break-all">{settings.contactEmail}</span></a>
              </p>
              <nav className="feed-about-social" aria-label={isEnglish ? "Social media" : "Sosyal medya"}>
                <a href="https://www.instagram.com/temhaangelio" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha Angelio on Instagram (opens in a new tab)" : "Temha Angelio Instagram profili (yeni sekmede açılır)"} title="Instagram · @temhaangelio" className="feed-about-social-link"><InstagramGlyph /></a>
                <a href="https://www.threads.com/@temhaangelio" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha Angelio on Threads (opens in a new tab)" : "Temha Angelio Threads profili (yeni sekmede açılır)"} title="Threads · @temhaangelio" className="feed-about-social-link">
                  <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7.5C18.8 3.8 16.1 2 12.2 2 6.2 2 3 5.8 3 12s3.2 10 9.2 10c5.2 0 8.8-2.8 8.8-6.5 0-3.5-3.2-5.6-7.7-5.6-3.2 0-5.2 1.5-5.2 3.6 0 1.8 1.4 3 3.4 3 3.1 0 4.7-2.3 4.7-5.8 0-3-1.5-4.7-4-4.7-1.6 0-2.9.7-3.8 1.9" /></svg>
                </a>
                <a href="https://x.com/temha" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha on X (opens in a new tab)" : "Temha X profili (yeni sekmede açılır)"} title="X · @temha" className="feed-about-social-link">
                  <svg className="size-[16px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" /></svg>
                </a>
                <a href="https://www.youtube.com/temhaangelio" target="_blank" rel="noopener noreferrer" aria-label={isEnglish ? "Temha Angelio on YouTube (opens in a new tab)" : "Temha Angelio YouTube kanalı (yeni sekmede açılır)"} title="YouTube · Temha Angelio" className="feed-about-social-link">
                  <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></svg>
                </a>
              </nav>
            </div>
          </aside>
        </article>
      </main>
    </VisitorShell>
  );
}
