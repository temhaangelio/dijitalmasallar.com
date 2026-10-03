import Link from "next/link";
import type { ReactNode } from "react";
import { FavoritesNavButton } from "@/components/features/visitor/favorites-nav-button";
import { LanguageLink } from "@/components/features/visitor/language-link";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { PullToRefresh } from "@/components/features/visitor/pull-to-refresh";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { BrandMark } from "@/components/ui/brand-mark";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { isPushConfigured, pushPublicKey } from "@/services/push";
import { getSiteSettings } from "@/services/settings";

/**
 * Public pages share a responsive masthead, reading surface and footer.
 * `lang` is set here rather than in the root layout because the root layout is shared with the
 * always-Turkish admin panel, and the visitor language is decided per request.
 *
 * The footer is rendered here rather than by each page, so no public page can end up without one.
 *
 * The service worker is registered from here too, so every public page installs it and none of the
 * panel's pages do.
 */
export async function VisitorShell({
  language,
  siteName,
  children,
  showHeader = true,
  reading = false,
}: {
  language: VisitorLanguage;
  siteName: string;
  children: ReactNode;
  showHeader?: boolean;
  reading?: boolean;
}) {
  const settings = await getSiteSettings();
  // The key is only handed out when the panel switch is on and the VAPID pair is configured; with an
  // empty key the toggle can register the worker but never subscribe.
  const publicKey = settings.modulePush && isPushConfigured() ? pushPublicKey() : "";
  return (
    <div lang={language} className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-4 pb-10 text-ink sm:px-8">
      {showHeader ? <>
      {/*
        One row: the mark and the logotype on the left, the reader's controls on the right. The
        sections live in the menu, behind the last of those controls.
      */}
      <header data-reading={reading || undefined} className="visitor-nav visitor-masthead feed-masthead relative z-[1] flex w-full flex-col items-center" aria-label="Site">
        <div className="feed-masthead-top relative flex w-full items-center justify-center">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="feed-masthead-lockup flex min-h-11 min-w-0 items-center text-ink transition-opacity hover:opacity-75"
          >
            <BrandMark className="visitor-logo-mark feed-logo-mark block shrink-0" />
            {siteName === "Dijital Masallar"
              ? <span className="visitor-wordmark-art visitor-wordmark-beside" aria-hidden="true" />
              : <span className="visitor-wordmark-beside truncate font-mono text-[17px] font-bold">{siteName}</span>}
          </Link>
          <div className="feed-masthead-controls absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
            <FavoritesNavButton language={language} />
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>
      </header>
      </> : null}
      <div className="visitor-content flex w-full flex-col items-center">
        {children}
        <VisitorFooter siteName={siteName} language={language} />
      </div>
      <ServiceWorkerRegistrar language={language} publicKey={publicKey} />
      <PullToRefresh language={language} />
      <InstallBanner language={language} />
    </div>
  );
}

function VisitorFooter({ siteName, language }: { siteName: string; language: VisitorLanguage }) {
  const isEnglish = language === "en";
  /* The masthead's bookend: an ink band with the mark and a line about the site, the sections in
     two columns, and the small print at the foot. */
  return (
    <footer className="visitor-footer feed-footer mt-16 w-full visitor-sans">
      <div className="feed-footer-brand">
        <p className="feed-footer-lede"><BrandMark className="visitor-logo-mark feed-footer-mark" />{isEnglish
          ? "Short, sourced notes on technology, AI, science and digital culture."
          : "Teknoloji, yapay zekâ, bilim ve dijital kültürden kaynaklı kısa notlar."}</p>
      </div>
      <nav className="feed-footer-nav" aria-label={isEnglish ? "Sections" : "Bölümler"}>
        {visitorNavItems.map((item) => <Link key={item.href} href={languageHref(item.href, language)} className="feed-footer-link">{item[language]}</Link>)}
        <Link href={languageHref("/favoriler", language)} className="feed-footer-link">{isEnglish ? "Favorites" : "Favoriler"}</Link>
      </nav>
      <div className="feed-footer-meta">
        <p>© {new Date().getFullYear()} {siteName}</p>
        <div className="feed-footer-meta-links">
          <a href={languageHref("/feed.xml", language)}>RSS</a>
          <span aria-hidden="true">·</span>
          <LanguageLink language={language} />
        </div>
      </div>
    </footer>
  );
}
