import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
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
  children,
}: {
  language: VisitorLanguage;
  siteName: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div lang={language} className="visitor-page flex min-h-screen flex-col items-center bg-canvas px-5 pb-12 pt-5 text-ink">
      <nav className="visitor-nav flex w-full max-w-[720px] items-center justify-between gap-4 py-2.5" aria-label={language === "en" ? "Site" : "Site"}>
        <Link href={languageHref("/", language)} className="flex shrink-0 items-center gap-2.5 rounded-full">
          <span aria-hidden="true" className="flex size-[30px] items-start justify-start rounded-[10px] bg-ink p-[7px]"><span className="size-[7px] rounded-full bg-ink-contrast" /></span>
          <span className="visitor-heading text-[15px] font-bold tracking-[-.03em]">{siteName}</span>
        </Link>
        {action}
      </nav>
      {children}
    </div>
  );
}

const navLink = "visitor-copy flex h-[34px] items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors";

/** Forward link to the about page, used from the feed. */
export function VisitorAboutLink({ language }: { language: VisitorLanguage }) {
  return (
    <Link href={languageHref("/about", language)} className={`${navLink} border border-line-strong bg-surface px-4 text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all duration-200 hover:-translate-y-px hover:border-ink/20 hover:bg-surface-2 hover:text-ink hover:shadow-soft active:translate-y-0`}>
      {language === "en" ? "About" : "Hakkında"}
    </Link>
  );
}

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
        {language === "en" ? "About & contact" : "Hakkında ve iletişim"}
      </Link>
    </footer>
  );
}
