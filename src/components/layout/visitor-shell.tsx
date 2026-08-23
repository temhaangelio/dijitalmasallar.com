import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { VisitorSettingsButton } from "@/components/features/visitor/visitor-settings-button";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

/**
 * The public pages share one frame: canvas background, 720px column, brand nav and footer.
 * `lang` is set here rather than in the root layout because the root layout is shared with the
 * always-Turkish admin panel, and the visitor language is decided per request.
 */
export function VisitorShell({
  language,
  siteName,
  action,
  topContent,
  children,
}: {
  language: VisitorLanguage;
  siteName: string;
  action?: ReactNode;
  topContent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div lang={language} className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-5 pb-12 pt-5 text-ink">
      <div className="visitor-ambient" aria-hidden="true" />
      {topContent}
      <nav className={`visitor-nav flex min-h-14 w-full max-w-[720px] items-center justify-between gap-4 py-3 ${topContent ? "mt-5" : ""}`} aria-label={language === "en" ? "Site" : "Site"}>
        <Link href={languageHref("/", language)} className="flex shrink-0 items-center gap-2.5 rounded-full">
          <span aria-hidden="true" className="flex size-8 items-start justify-start rounded-[11px] bg-ink p-[7px] shadow-[0_2px_8px_rgba(0,0,0,.12)]"><span className="size-[7px] rounded-full bg-ink-contrast" /></span>
          <span className="visitor-heading text-xl font-bold tracking-[-.04em] sm:text-[22px]">{siteName}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {action}
          <VisitorSettingsButton language={language} />
          <VisitorMenu language={language} siteName={siteName} />
        </div>
      </nav>
      {children}
    </div>
  );
}

const navLink = "visitor-copy flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors";

/** Back-to-feed action used on the article and about pages. */
export function VisitorBackLink({ language, label }: { language: VisitorLanguage; label?: string }) {
  return (
    <Link href={languageHref("/", language)} className={`${navLink} text-ink-2 hover:bg-surface-2 hover:text-ink`}>
      <ArrowLeft size={14} aria-hidden="true" /> {label ?? (language === "en" ? "Back to feed" : "Akışa dön")}
    </Link>
  );
}

export function VisitorFooter({ language, siteName }: { language: VisitorLanguage; siteName: string }) {
  return (
    <footer className="visitor-footer visitor-muted mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line-strong px-2 pt-7 text-[13px] font-medium text-muted">
      <span>© {new Date().getFullYear()} {siteName}</span>
      <Link href={languageHref("/about", language)} className="rounded-sm transition-colors hover:text-ink">
        {language === "en" ? "About" : "Hakkında"}
      </Link>
    </footer>
  );
}
