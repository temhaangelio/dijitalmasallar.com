import Link from "next/link";
import type { ReactNode } from "react";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { BrandMark } from "@/components/ui/brand-mark";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
import { isPushConfigured, pushPublicKey } from "@/services/push";
import { getSiteSettings } from "@/services/settings";

const binaryGlyphs = [
  { value: "0", left: 2, top: 4, size: 68, opacity: 0.04, blur: 1.2 },
  { value: "1", left: 12, top: 16, size: 22, opacity: 0.13, blur: 0 },
  { value: "0", left: 22, top: 7, size: 13, opacity: 0.09, blur: 0 },
  { value: "1", left: 5, top: 48, size: 17, opacity: 0.1, blur: 0 },
  { value: "0", left: 17, top: 62, size: 34, opacity: 0.055, blur: 0.4 },
  { value: "1", left: 28, top: 40, size: 11, opacity: 0.08, blur: 0 },
  { value: "1", left: 94, top: 1, size: 62, opacity: 0.035, blur: 1.2 },
  { value: "0", left: 84, top: 14, size: 25, opacity: 0.12, blur: 0 },
  { value: "1", left: 74, top: 5, size: 12, opacity: 0.09, blur: 0 },
  { value: "0", left: 96, top: 51, size: 18, opacity: 0.1, blur: 0 },
  { value: "1", left: 79, top: 63, size: 36, opacity: 0.05, blur: 0.5 },
  { value: "0", left: 69, top: 41, size: 11, opacity: 0.08, blur: 0 },
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
}: {
  language: VisitorLanguage;
  siteName: string;
  children: ReactNode;
  showHeader?: boolean;
}) {
  const settings = await getSiteSettings();
  const description = language === "en" ? settings.descriptionEn : settings.description;
  // The key is only handed out when the panel switch is on and the VAPID pair is configured; with an
  // empty key the toggle can register the worker but never subscribe.
  const publicKey = settings.modulePush && isPushConfigured() ? pushPublicKey() : "";
  return (
    <div lang={language} className="visitor-page relative flex min-h-screen flex-col items-center overflow-x-clip bg-canvas px-6 pb-10 text-ink sm:px-8">
      {showHeader ? <>
      <div className="visitor-binary-backdrop" aria-hidden="true">
        {binaryGlyphs.map((glyph, index) => (
          <span
            key={index}
            style={{
              left: `${glyph.left}%`,
              top: `${glyph.top}%`,
              fontSize: `${glyph.size}px`,
              opacity: glyph.opacity,
              filter: glyph.blur ? `blur(${glyph.blur}px)` : undefined,
            }}
          >
            {glyph.value}
          </span>
        ))}
      </div>
      <nav className="visitor-nav relative z-[1] flex w-full max-w-[900px] flex-col items-center pb-4 pt-12 text-center sm:pb-6 sm:pt-16" aria-label={language === "en" ? "Site" : "Site"}>
        <div className="flex w-full max-w-[640px] items-center justify-between">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="transition-opacity hover:opacity-75"
          >
            <BrandMark className="visitor-logo-mark block !size-9 !rounded-[12px]" />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>
        <Link href={languageHref("/", language)} className="mt-8 font-mono text-[22px] font-bold leading-none tracking-[-.03em] text-ink antialiased [text-rendering:geometricPrecision] sm:mt-10 sm:text-[30px]">
          {siteName}
        </Link>
        <p className="visitor-copy visitor-serif mt-4 max-w-[48ch] text-[15px] font-normal leading-[1.5] text-muted [text-wrap:balance] sm:text-[19px]">{description}</p>
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
