import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bookmark, FileText, Heart, Mail, Rss, Search, Smartphone, Sparkles } from "lucide-react";
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

/** The author's accounts, labelled: bare glyphs asked the reader to know every brand's mark. */
function socialLinks(isEnglish: boolean) {
  return [
    { href: "https://www.instagram.com/temhaangelio", label: "Instagram", handle: "@temhaangelio", icon: <InstagramGlyph size={17} /> },
    { href: "https://www.youtube.com/temhaangelio", label: "YouTube", handle: "Temha Angelio", icon: <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></svg> },
    { href: "https://www.threads.com/@temhaangelio", label: "Threads", handle: "@temhaangelio", icon: <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7.5C18.8 3.8 16.1 2 12.2 2 6.2 2 3 5.8 3 12s3.2 10 9.2 10c5.2 0 8.8-2.8 8.8-6.5 0-3.5-3.2-5.6-7.7-5.6-3.2 0-5.2 1.5-5.2 3.6 0 1.8 1.4 3 3.4 3 3.1 0 4.7-2.3 4.7-5.8 0-3-1.5-4.7-4-4.7-1.6 0-2.9.7-3.8 1.9" /></svg> },
    { href: "https://x.com/temha", label: "X", handle: "@temha", icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" /></svg> },
    { href: "https://www.temhaangelio.com/", label: isEnglish ? "Website" : "Web sitesi", handle: "temhaangelio.com", icon: <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" /> },
  ];
}

/**
 * The about page, read top to bottom as a short story rather than scanned as one boxed card: what
 * the site is, how a note is made, the ways to keep up with it, who is behind it, how to reach him.
 * Each part is its own section with a plain heading, so a reader can stop at the one they came for.
 */
export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";

  const steps = isEnglish
    ? [
        { icon: Search, title: "Finds", text: "Follows technology, AI, science and digital culture — from official sources only." },
        { icon: Sparkles, title: "Summarises", text: "AI reduces each story to what matters, without clickbait." },
        { icon: FileText, title: "Publishes a note", text: "A short note with its source, readable in under a minute." },
      ]
    : [
        { icon: Search, title: "Bulur", text: "Teknoloji, yapay zekâ, bilim ve dijital kültür gündemini yalnızca resmî kaynaklardan takip eder." },
        { icon: Sparkles, title: "Özetler", text: "Yapay zekâ her haberi özüne indirir; clickbait yok." },
        { icon: FileText, title: "Nota dönüştürür", text: "Kaynağıyla birlikte, bir dakikadan kısa sürede okunan kısa bir not." },
      ];

  const ways = [
    { href: languageHref("/feed.xml", language), icon: Rss, title: isEnglish ? "RSS feed" : "RSS akışı", text: isEnglish ? "New notes in your reader." : "Yeni notlar okuyucunda." },
    { href: languageHref("/ebulten", language), icon: Mail, title: isEnglish ? "Newsletter" : "E-bülten", text: isEnglish ? "The day's notes by e-mail." : "Günün notları e-postanda." },
    { href: languageHref("/favoriler", language), icon: Bookmark, title: isEnglish ? "Favorites" : "Favoriler", text: isEnglish ? "Save notes to read later, in this browser." : "Sonra okumak için kaydet; bu tarayıcıda saklanır." },
  ];

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="visitor-wide-page visitor-about mt-6 w-full max-w-[640px] sm:mt-10">
        <header className="visitor-about-hero">
          <div className="min-w-0">
            <p className="visitor-about-eyebrow visitor-sans">{isEnglish ? "About" : "Hakkında"}</p>
            <h1 className="visitor-about-title visitor-sans">{isEnglish ? "The day in technology, in short notes." : "Teknoloji gündemi, kısa notlarla."}</h1>
            <p className="visitor-about-lead visitor-sans">{isEnglish
              ? "Dijital Masallar gathers the technology, AI, science and digital culture news from official sources and turns each story into a short note. A plain design, easy reading and few ads let you catch up on the day in minutes."
              : "Dijital Masallar; teknoloji, yapay zekâ, bilim ve dijital kültür gündemini resmî kaynaklardan derleyip her haberi kısa bir nota dönüştürür. Sade tasarım, kolay okuma ve az reklamla günü birkaç dakikada yakalarsın."}</p>
          </div>
        </header>

        <section className="visitor-about-block" aria-labelledby="about-how">
          <h2 id="about-how" className="visitor-about-heading visitor-sans">{isEnglish ? "How a note is made" : "Bir not nasıl hazırlanır?"}</h2>
          <ol className="visitor-about-steps visitor-sans">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="visitor-card visitor-about-step">
                <span className="visitor-about-step-number" aria-hidden="true">{index + 1}</span>
                <Icon size={20} strokeWidth={1.6} className="visitor-about-step-icon" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="visitor-about-block" aria-labelledby="about-follow">
          <h2 id="about-follow" className="visitor-about-heading visitor-sans">{isEnglish ? "Ways to keep up" : "Takip etmenin yolları"}</h2>
          <div className="visitor-about-ways visitor-sans">
            {ways.map(({ href, icon: Icon, title, text }) => (
              <Link key={title} href={href} className="visitor-card visitor-about-way">
                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                <span className="min-w-0"><strong>{title}</strong><span>{text}</span></span>
                <ArrowUpRight size={16} strokeWidth={1.6} className="visitor-about-way-arrow" aria-hidden="true" />
              </Link>
            ))}
            <div className="visitor-card visitor-about-way visitor-about-way-static">
              <Smartphone size={20} strokeWidth={1.6} aria-hidden="true" />
              <span className="min-w-0">
                <strong>{isEnglish ? "Add to home screen" : "Ana ekrana ekle"}</strong>
                <span>{isEnglish ? "Opens like an app, with notifications. Settings → More settings." : "Uygulama gibi açılır, bildirim alırsın. Ayarlar → Diğer ayarlar."}</span>
              </span>
            </div>
          </div>
        </section>

        <section className="visitor-about-block" aria-labelledby="about-author">
          <h2 className="visitor-about-heading visitor-sans">{isEnglish ? "Who is behind it" : "Arkasında kim var?"}</h2>
          <div className="visitor-card visitor-about-person visitor-sans">
            <div className="visitor-about-person-head">
              <div className="visitor-about-avatar">
                <Image src="/about-illustration-logo.png" alt={isEnglish ? "Illustrated portrait of Temha Angelio" : "Temha Angelio illüstrasyonu"} width={1254} height={1254} sizes="72px" priority className="block h-auto w-full object-contain" />
              </div>
              <div className="min-w-0">
                <h3 id="about-author">Temha Angelio</h3>
                <p>{isEnglish ? "Founder and editor of Dijital Masallar." : "Dijital Masallar’ın kurucusu ve editörü."}</p>
              </div>
            </div>
            <ul className="visitor-about-socials" aria-label={isEnglish ? "Accounts" : "Hesaplar"}>
              {socialLinks(isEnglish).map(({ href, label, handle, icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {icon}
                    <span><strong>{label}</strong><span>{handle}</span></span>
                    <span className="sr-only">{isEnglish ? "(opens in a new tab)" : "(yeni sekmede açılır)"}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="visitor-about-block visitor-about-contact visitor-sans" aria-labelledby="about-contact">
          <h2 id="about-contact" className="visitor-about-heading">{isEnglish ? "Get in touch" : "İletişim"}</h2>
          <p>{isEnglish ? "Suggestions, corrections, or a hello — all welcome." : "Öneri, düzeltme ya da bir merhaba — hepsi memnuniyetle."}</p>
          <a href={`mailto:${settings.contactEmail}`} className="visitor-about-mail">
            <Mail size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="break-all">{settings.contactEmail}</span>
          </a>
        </section>

        <p className="visitor-sans mt-10 flex items-center justify-center gap-2 text-[13px] text-muted">
          <Heart className="size-3.5" aria-hidden="true" />
          {isEnglish ? "Made with love in Bursa." : "Bursa’da sevgiyle üretiliyor."}
        </p>
      </main>
    </VisitorShell>
  );
}
