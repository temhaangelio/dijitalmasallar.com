import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LanguageLink } from "@/components/features/visitor/language-link";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { PullToRefresh } from "@/components/features/visitor/pull-to-refresh";
import { VisitorHeaderBackdrop } from "@/components/features/visitor/visitor-header-backdrop";
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
  compact = false,
  reading = false,
}: {
  language: VisitorLanguage;
  siteName: string;
  children: ReactNode;
  showHeader?: boolean;
  /** Drops the tagline. A story page has its own subject; the site's pitch is not it. */
  compact?: boolean;
  reading?: boolean;
}) {
  const settings = await getSiteSettings();
  const description = language === "en" ? settings.descriptionEn : settings.description;
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
        The mark anchors the top-left corner as a way home; the name, the tagline and the navigation
        run down the centre under it.

        The two are separate on purpose, at the reader's request. Worth knowing about the trade: the
        header carries two alignments at once this way, and the site states its identity twice — as
        a glyph in the corner and as a logotype in the middle.
      */}
      <header data-reading={reading || undefined} className="visitor-nav visitor-masthead relative z-[1] flex w-full max-w-[640px] flex-col items-center pb-2 pt-6 text-center sm:pb-3 sm:pt-8" aria-label="Site">
        {!reading && <VisitorHeaderBackdrop />}
        <div className="flex w-full shrink-0 items-center justify-between gap-2">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="flex min-h-11 min-w-0 items-center gap-3 transition-opacity hover:opacity-75"
          >
            <BrandMark className="visitor-logo-mark block shrink-0 !size-9 !rounded-[12px] sm:!size-10 sm:!rounded-[13px] xl:!size-[52px] xl:!rounded-[16px]" />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>

        <Link
          href={languageHref("/", language)}
          className="visitor-wordmark mt-6 max-w-full py-1 font-mono font-bold text-ink antialiased transition-opacity [text-rendering:geometricPrecision] hover:opacity-75 sm:mt-7"
        >
          {siteName === "Dijital Masallar" ? <>
            <span className="sr-only">{siteName}</span>
            <span className="visitor-wordmark-art" aria-hidden="true" />
          </> : siteName}
        </Link>

        {compact || reading ? null : (
          <p className="visitor-tagline visitor-sans">{description}</p>
        )}

        {reading ? null : <VisitorHeaderNav language={language} />}
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
    <footer className="visitor-footer mt-14 flex w-full max-w-[640px] flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line px-1 pt-6">
      <p className="visitor-muted visitor-sans text-[11px] font-normal text-muted">© {new Date().getFullYear()} {siteName}</p>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <a href={languageHref("/feed.xml", language)} className="visitor-tap visitor-sans text-[11px] font-normal text-muted transition-colors hover:text-accent">RSS</a>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <LanguageLink language={language} />

    </footer>
  );
}
