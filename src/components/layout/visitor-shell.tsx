import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { FavoritesNavButton } from "@/components/features/visitor/favorites-nav-button";
import { LanguageLink } from "@/components/features/visitor/language-link";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { PullToRefresh } from "@/components/features/visitor/pull-to-refresh";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { BrandMark } from "@/components/ui/brand-mark";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { darkThemeColor, lightThemeColor, themeCookie } from "@/lib/visitor-theme";
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
  /*
   * iOS Safari paints the band behind the status bar from the `theme-color` it reads as it first
   * parses the document, and never repaints it for a tag written later — so a reader who chose dark
   * on a light phone sat under a white band whatever the client did afterwards. The choice travels
   * in a cookie for exactly this tag. With no cookie, "system" is the preference, and there the
   * media queries and the resolved theme agree by definition.
   */
  const themePreference = (await cookies()).get(themeCookie)?.value;
  // The key is only handed out when the panel switch is on and the VAPID pair is configured; with an
  // empty key the toggle can register the worker but never subscribe.
  const publicKey = settings.modulePush && isPushConfigured() ? pushPublicKey() : "";
  return (
    <div lang={language} className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-4 pb-10 text-ink sm:px-8">
      {themePreference === "dark" || themePreference === "light"
        ? <meta name="theme-color" content={themePreference === "dark" ? darkThemeColor : lightThemeColor} />
        : <>
            <meta name="theme-color" media="(prefers-color-scheme: light)" content={lightThemeColor} />
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content={darkThemeColor} />
          </>}
      {showHeader ? <>
      {/*
        One row and nothing under it: the mark and the logotype top-left as the way home, the
        sections beside them from `sm` up, the reader's controls on the right. A phone has no room
        for the sections in the row, so there they live in the menu and in the capsule that
        appears on the way back up the feed.
      */}
      <header data-reading={reading || undefined} className="visitor-nav visitor-masthead feed-masthead relative z-[1] flex w-full flex-col pb-2 pt-4 sm:pb-3 sm:pt-6" aria-label="Site">
        <div className="visitor-masthead-row relative flex w-full shrink-0 items-center justify-between gap-2">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="flex min-h-11 min-w-0 items-center gap-3 text-ink transition-opacity hover:opacity-75"
          >
            <BrandMark className="visitor-logo-mark feed-logo-mark block shrink-0" />
            {siteName === "Dijital Masallar"
              ? <span className="visitor-wordmark-art visitor-wordmark-beside" aria-hidden="true" />
              : <span className="visitor-wordmark-beside truncate font-mono text-[17px] font-bold">{siteName}</span>}
          </Link>
          {reading ? null : <div className="feed-masthead-nav"><VisitorHeaderNav language={language} /></div>}
          <div className="flex shrink-0 items-center gap-1">
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
  return (
    <footer className="visitor-footer feed-footer mt-16 w-full border-t border-line pt-5 visitor-sans">
      <nav className="feed-footer-nav" aria-label={language === "en" ? "Sections" : "Bölümler"}>
        {visitorNavItems.map((item) => <Link key={item.href} href={languageHref(item.href, language)} className="feed-footer-link">{item[language]}</Link>)}
        <Link href={languageHref("/favoriler", language)} className="feed-footer-link">{language === "en" ? "Favorites" : "Favoriler"}</Link>
      </nav>
      <div className="feed-footer-meta">
        <p className="visitor-muted text-muted">© {new Date().getFullYear()} {siteName}</p>
        <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
        <a href={languageHref("/feed.xml", language)} className="visitor-tap text-muted transition-colors hover:text-ink">RSS</a>
        <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
        <LanguageLink language={language} />
      </div>
    </footer>
  );
}
