import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LanguageLink } from "@/components/features/visitor/language-link";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { BrandMark } from "@/components/ui/brand-mark";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { darkThemeColor, lightThemeColor, themeCookie } from "@/lib/visitor-theme";
import { isPushConfigured, pushPublicKey } from "@/services/push";
import { getSiteSettings } from "@/services/settings";

// Fixed positions avoid hydration changes; CSS handles the entire animation.
const headerSignals = [
  { value: "0", left: 5, top: 31, size: 32 },
  { value: "1", left: 16, top: 66, size: 40 },
  { value: "1", left: 25, top: 14, size: 26 },
  { value: "0", left: 9, top: 76, size: 24 },
  { value: "0", left: 83, top: 23, size: 38 },
  { value: "1", left: 91, top: 58, size: 30 },
  { value: "0", left: 75, top: 80, size: 28 },
  { value: "1", left: 91, top: 79, size: 24 },
];


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
      <nav data-intro={!compact && !reading ? "true" : undefined} className="visitor-nav relative z-[1] flex w-full max-w-[640px] flex-col items-center pb-5 pt-6 text-center sm:pb-7 sm:pt-8" aria-label="Site">
        {!reading && <div className="visitor-header-signals" aria-hidden="true">
          {headerSignals.map((signal, index) => <span key={index} className="visitor-header-signal" style={{
            left: `${signal.left}%`, top: `${signal.top}%`, fontSize: `${signal.size}px`,
            animationDelay: `${-index * 1.8}s`, animationDuration: `${12 + index % 3 * 2}s`,
          }}><span>{signal.value}</span></span>)}

        </div>}
        <div className="flex w-full shrink-0 items-center justify-between gap-2">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="flex min-h-11 min-w-0 items-center gap-3 transition-opacity hover:opacity-75"
          >
            <BrandMark className="visitor-logo-mark block shrink-0 !size-9 !rounded-[12px] sm:!size-10 sm:!rounded-[13px]" />
            {reading ? <span className="min-w-0 font-mono text-[13px] font-bold leading-snug text-left sm:text-[18px]">{siteName}</span> : null}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>

        {reading ? null : <Link
          href={languageHref("/", language)}
          className="mt-6 max-w-full truncate font-mono text-[24px] font-bold leading-[1.15] tracking-[-.01em] text-ink antialiased transition-opacity [text-rendering:geometricPrecision] hover:opacity-75 sm:mt-7 sm:text-[32px]"
        >
          {/* Two notes on the type. Monospaced glyphs already carry their own sidebearings, so the
              −.03em this used to be set with was pulling them into each other. And the leading has
              to leave room under the baseline: at `leading-none` the line box is exactly the font
              size, and `truncate` clips whatever falls outside it — which took the tail off the j
              in Dijital. */}
          {siteName}
        </Link>}

        {compact || reading ? null : (
          <p className="visitor-copy visitor-serif mt-4 max-w-[42ch] text-[15px] font-normal leading-[1.5] text-muted [text-wrap:balance] sm:mt-5 sm:text-[19px]">{description}</p>
        )}

        {reading ? null : <VisitorHeaderNav language={language} />}
      </nav></> : null}
      {children}
      <VisitorFooter siteName={siteName} language={language} />
      <ServiceWorkerRegistrar language={language} publicKey={publicKey} />
      <InstallBanner language={language} />
    </div>
  );
}

function VisitorFooter({ siteName, language }: { siteName: string; language: VisitorLanguage }) {
  return (
    <footer className="visitor-footer mt-14 flex w-full max-w-[640px] flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line px-1 pt-6">
      <p className="visitor-muted visitor-sans text-[11px] font-normal text-muted">© {new Date().getFullYear()} {siteName}</p>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <LanguageLink language={language} />

    </footer>
  );
}
