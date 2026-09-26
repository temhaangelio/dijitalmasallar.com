import Link from "next/link";
import { NewsletterModal } from "@/components/features/visitor/newsletter-modal";
import { ListenModal } from "@/components/features/visitor/listen-modal";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { FavoritesNavButton } from "@/components/features/visitor/favorites-nav-button";
import { LanguageLink } from "@/components/features/visitor/language-link";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { PullToRefresh } from "@/components/features/visitor/pull-to-refresh";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
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
        One quiet bar, pinned to the top while reading: the mark and logotype on the left as the way
        home, the three sections in the middle, the reader's own controls on the right. The notes are
        what a reader came for, so nothing else stands in front of them — the tagline and the "About"
        link live in the footer, and the old centred lockup, halftone and binary backdrop are gone.

        A phone has no room for the sections inside the bar, so they sit in a short row under it,
        which scrolls away with the page; the floating capsule brings them back on the way up.
      */}
      <header data-reading={reading || undefined} className="visitor-topbar" aria-label="Site">
        <div className="visitor-topbar-inner">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="visitor-topbar-brand"
          >
            <BrandMark className="visitor-logo-mark block shrink-0 !size-8 !rounded-[10px]" />
            {siteName === "Dijital Masallar"
              ? <span className="visitor-wordmark-art visitor-topbar-wordmark" aria-hidden="true" />
              : <span className="truncate font-mono text-[16px] font-bold">{siteName}</span>}
          </Link>
          {reading ? <span className="visitor-topbar-nav" /> : <div className="visitor-topbar-nav"><VisitorHeaderNav language={language} /></div>}
          <div className="visitor-topbar-actions">
            <div id="visitor-topbar-slot" className="contents" />
            <FavoritesNavButton language={language} />
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>
      </header>
      {reading ? null : <div className="visitor-subnav"><VisitorHeaderNav language={language} /></div>}
      </> : null}
      <div className="visitor-content flex w-full flex-col items-center">
        {children}
        <VisitorFooter siteName={siteName} language={language} />
      </div>
      <ServiceWorkerRegistrar language={language} publicKey={publicKey} />
      <PullToRefresh language={language} />
      <InstallBanner language={language} />
      <ListenModal />
      <NewsletterModal />
    </div>
  );
}

function VisitorFooter({ siteName, language }: { siteName: string; language: VisitorLanguage }) {
  return (
    <footer className="visitor-footer mt-14 flex w-full max-w-[640px] flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line px-1 pt-6">
      <p className="visitor-muted visitor-sans text-[11px] font-normal text-muted">© {new Date().getFullYear()} {siteName}</p>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <a href={languageHref("/feed.xml", language)} className="visitor-tap visitor-sans text-[11px] font-normal text-muted transition-colors hover:text-accent">RSS</a>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <LanguageLink language={language} />
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <Link href={languageHref("/about", language)} className="visitor-tap visitor-sans text-[11px] font-normal text-muted transition-colors hover:text-accent">{language === "en" ? "About" : "Hakkında"}</Link>

    </footer>
  );
}
