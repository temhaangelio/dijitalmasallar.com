import Link from "next/link";
import type { ReactNode } from "react";
import { Rss } from "lucide-react";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { VisitorSettingsButton } from "@/components/features/visitor/visitor-settings-button";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The public pages share one frame: canvas background, 720px column, brand nav and footer.
 * `lang` is set here rather than in the root layout because the root layout is shared with the
 * always-Turkish admin panel, and the visitor language is decided per request.
 *
 * The footer is rendered here rather than by each page, so no public page can end up without one.
 */
export function VisitorShell({
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
  return (
    <div lang={language} className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-5 pb-10 pt-5 text-ink">
      <div className="visitor-ambient" aria-hidden="true" />
      {topContent}
      <nav className={`visitor-nav flex min-h-14 w-full max-w-[720px] items-center justify-between gap-4 py-3 ${topContent ? "mt-5" : ""}`} aria-label={language === "en" ? "Site" : "Site"}>
        <Link href={languageHref("/", language)} className="flex shrink-0 items-center gap-2.5 rounded-full">
          <span aria-hidden="true" className="relative size-8 overflow-hidden rounded-[11px] bg-ink shadow-[0_2px_8px_rgba(0,0,0,.12)]"><span className="diji-loading-dot visitor-logo-dot absolute left-2 top-2 size-[7px] rounded-full bg-ink-contrast [--diji-loading-travel:9px]" /></span>
          <span className="visitor-heading text-xl font-bold tracking-[-.04em] sm:text-[22px]">{siteName}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <VisitorSettingsButton language={language} />
          <VisitorMenu language={language} siteName={siteName} />
        </div>
      </nav>
      {children}
      <VisitorFooter language={language} siteName={siteName} />
    </div>
  );
}

function VisitorFooter({ language, siteName }: { language: VisitorLanguage; siteName: string }) {
  const isEnglish = language === "en";

  return (
    <footer className="visitor-footer mt-14 flex w-full max-w-[720px] flex-col gap-5 border-t border-line-strong px-1 pt-7 sm:flex-row sm:items-center sm:justify-between">
      <nav className="-ml-2.5 flex flex-wrap items-center gap-x-1 gap-y-1" aria-label={isEnglish ? "Footer" : "Alt bilgi"}>
        {visitorNavItems.map((item) => (
          <Link
            key={item.href}
            href={languageHref(item.href, language)}
            className="visitor-copy rounded-full px-2.5 py-1.5 text-[length:var(--vt-ui)] font-semibold text-muted transition-colors hover:text-ink"
          >
            {item[language]}
          </Link>
        ))}
        <a
          href={isEnglish ? "/rss.xml" : "/rss.xml?lang=tr"}
          className="visitor-copy flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[length:var(--vt-ui)] font-semibold text-muted transition-colors hover:text-ink"
        >
          <Rss className="size-3.5" aria-hidden="true" />RSS
        </a>
      </nav>
      <p className="visitor-muted px-1.5 text-[length:var(--vt-meta)] font-medium text-faint">© {new Date().getFullYear()} {siteName}</p>
    </footer>
  );
}
