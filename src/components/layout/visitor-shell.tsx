import Link from "next/link";
import type { ReactNode } from "react";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
import { FavoritesNavButton } from "@/components/features/visitor/favorites-nav-button";
import { VisitorHeaderNav } from "@/components/features/visitor/visitor-header-nav";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";
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
    <div lang={language} className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-6 pb-10 text-ink sm:px-8">
      {showHeader ? <nav className="visitor-nav flex w-full max-w-[900px] flex-col items-center pb-0 pt-9 text-center sm:pt-14" aria-label={language === "en" ? "Site" : "Site"}>
        <div className="flex w-full max-w-[640px] items-center justify-between">
          <Link
            href={languageHref("/", language)}
            aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
            className="transition-opacity hover:opacity-75"
          >
            <span className="brand-mark visitor-logo-mark block !size-9 !rounded-[12px]" aria-hidden="true" />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <FavoritesNavButton language={language} />
            {/* Keep the bell visible when the module is enabled, even if a deployment is missing its
                VAPID configuration; the button then explains the configuration problem safely. */}
            {settings.modulePush ? <PushNavButton language={language} publicKey={publicKey} /> : null}
            <VisitorMenu language={language} pushPublicKey={publicKey} />
          </div>
        </div>
        <Link href={languageHref("/", language)} className="mt-5 font-mono text-[22px] font-bold leading-none tracking-[-.03em] text-ink antialiased [text-rendering:geometricPrecision] sm:text-[30px]">
          {siteName}
        </Link>
        <p className="visitor-copy visitor-serif mt-4 max-w-[38ch] text-[15px] font-normal leading-[1.5] text-muted sm:text-[19px]">{description}</p>
        <VisitorHeaderNav language={language} />
      </nav> : null}
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
