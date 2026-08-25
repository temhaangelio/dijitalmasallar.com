import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { InstallBanner, PushNavButton, ServiceWorkerRegistrar } from "@/components/features/visitor/push";
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
  topContent,
  children,
}: {
  language: VisitorLanguage;
  siteName: string;
  topContent?: ReactNode;
  children: ReactNode;
}) {
  const settings = await getSiteSettings();
  // The key is only handed out when the panel switch is on and the VAPID pair is configured; with an
  // empty key the toggle can register the worker but never subscribe.
  const publicKey = settings.modulePush && isPushConfigured() ? pushPublicKey() : "";

  return (
    <div lang={language} className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-5 pb-10 pt-5 text-ink">
      <div className="visitor-ambient-frame" aria-hidden="true"><div className="visitor-ambient" /></div>
      {topContent}
      <nav className={`visitor-nav flex min-h-14 w-full max-w-[720px] items-center justify-between gap-4 py-3 ${topContent ? "mt-5" : ""}`} aria-label={language === "en" ? "Site" : "Site"}>
        <Link href={languageHref("/", language)} className="flex shrink-0 items-center gap-2.5 rounded-full">
          <span aria-hidden="true" className="relative size-8 overflow-hidden rounded-[11px] bg-ink shadow-[0_2px_8px_rgba(0,0,0,.12)]"><span className="diji-loading-dot visitor-logo-dot absolute left-2 top-2 size-[7px] rounded-full bg-ink-contrast [--diji-loading-travel:9px]" /></span>
          <span className="visitor-heading text-xl font-bold tracking-[-.04em] sm:text-[22px]">{siteName}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* The bell keeps a stable place immediately before search, including while the browser's
              notification capability is being resolved. */}
          {publicKey ? <PushNavButton language={language} publicKey={publicKey} /> : null}
          {/* Search sits in the bar itself rather than only inside the menu: it is the one action a
              reader reaches for from any page, and the sheet is one tap too far for it. */}
          <Link
            href={languageHref("/search", language)}
            aria-label={language === "en" ? "Search" : "Arama"}
            className="grid size-9 place-items-center rounded-[12px] bg-ink text-ink-contrast shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-all hover:-translate-y-px hover:opacity-80 hover:shadow-soft"
          >
            <Search size={17} aria-hidden="true" />
          </Link>
          <VisitorMenu language={language} siteName={siteName} pushPublicKey={publicKey} />
        </div>
      </nav>
      {children}
      <VisitorFooter siteName={siteName} />
      <ServiceWorkerRegistrar language={language} publicKey={publicKey} />
      <InstallBanner language={language} />
    </div>
  );
}

function VisitorFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="visitor-footer mt-14 flex w-full max-w-[720px] justify-center border-t border-line-strong px-1 pt-7">
      <p className="visitor-muted text-[length:var(--vt-meta)] font-medium text-faint">© {new Date().getFullYear()} {siteName}</p>
    </footer>
  );
}
