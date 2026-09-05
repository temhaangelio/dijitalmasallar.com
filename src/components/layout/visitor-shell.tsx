import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LanguageShortcut } from "@/components/features/visitor/language-shortcut";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { BrandMark } from "@/components/ui/brand-mark";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { darkThemeColor, lightThemeColor, themeCookie } from "@/lib/visitor-theme";
import { isPushConfigured, pushPublicKey } from "@/services/push";
import { getSiteSettings } from "@/services/settings";

/**
 * The public pages share one frame: canvas background, 720px column, brand nav and footer.
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
}: {
  language: VisitorLanguage;
  siteName: string;
  children: ReactNode;
  showHeader?: boolean;
  /** Drops the tagline. A story page has its own subject; the site's pitch is not it. */
  compact?: boolean;
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
      <div className="visitor-masthead-backdrop" aria-hidden="true" />
      {/*
        The masthead runs on one centre axis: mark and name are a single lockup, the tagline sits
        under it, and a rule closes the block off from the page. The mark used to sit alone in the
        top-left corner while the name was centred, which gave the header two axes at once and made
        the site say its own name twice, in two typefaces, in two places.

        The controls stay in their own row above. They cannot share the lockup's line: centred, the
        name leaves about 180px of clear space beside it on a 375px screen and the controls need 120.
        The language switch anchors that row's left end, which the brand mark used to occupy.
      */}
      <nav className="visitor-nav relative z-[1] flex w-full max-w-[900px] flex-col items-center pb-5 pt-6 text-center sm:pb-7 sm:pt-9" aria-label="Site">
        <div className="flex w-full max-w-[640px] shrink-0 items-center justify-between gap-2">
          <LanguageShortcut language={language} />
          <div className="flex shrink-0 items-center gap-2">
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>

        <Link
          href={languageHref("/", language)}
          className="mt-5 flex items-center gap-3 transition-opacity hover:opacity-75 sm:mt-6 sm:gap-4"
        >
          <BrandMark className="visitor-logo-mark block !size-10 !rounded-[13px] sm:!size-11 sm:!rounded-[14px]" />
          {/* Monospaced glyphs already carry their own sidebearings; the −.03em the name used to be
              set with was pulling them into each other. */}
          <span className="font-mono text-[24px] font-bold leading-none tracking-[-.01em] text-ink antialiased [text-rendering:geometricPrecision] sm:text-[32px]">
            {siteName}
          </span>
        </Link>

        {compact ? null : (
          <p className="visitor-copy visitor-serif mt-4 max-w-[42ch] text-[15px] font-normal leading-[1.5] text-muted [text-wrap:balance] sm:mt-5 sm:text-[19px]">{description}</p>
        )}

        <VisitorHeaderNav language={language} />
      </nav></> : null}
      {children}
      <VisitorFooter siteName={siteName} />
      <ServiceWorkerRegistrar language={language} publicKey={publicKey} />
      <InstallBanner language={language} />
    </div>
  );
}

function VisitorFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="visitor-footer mt-14 flex w-full max-w-[640px] justify-center border-t border-line px-1 pt-6">
      <p className="visitor-muted font-mono text-[11px] font-normal text-muted">© {new Date().getFullYear()} {siteName}</p>
    </footer>
  );
}
