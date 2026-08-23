import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { VisitorLanguage } from "@/lib/visitor-language";

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
        <Link href={`/?lang=${language}`} className="flex shrink-0 items-center gap-2.5 rounded-full">
          <span aria-hidden="true" className="flex size-[30px] items-start justify-start rounded-[10px] bg-ink p-[7px]"><span className="size-[7px] rounded-full bg-ink-contrast" /></span>
          <span className="visitor-heading text-[15px] font-bold tracking-[-.03em]">{siteName}</span>
        </Link>
        {action}
      </nav>
      {children}
    </div>
  );
}

const navLink = "visitor-copy flex h-[34px] items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors";

/** Feed / About switch used on the home page. */
export function VisitorTabs({ language, active }: { language: VisitorLanguage; active: "feed" | "about" }) {
  const tabs = [
    { key: "feed" as const, href: `/?lang=${language}`, label: language === "en" ? "Feed" : "Akış" },
    { key: "about" as const, href: `/hakkinda?lang=${language}`, label: language === "en" ? "About" : "Hakkında" },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`${navLink} ${tab.key === active ? "bg-ink font-semibold text-ink-contrast" : "text-ink-2 hover:bg-surface-2"}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

/** Back-to-feed action used on the article and about pages. */
export function VisitorBackLink({ language, label }: { language: VisitorLanguage; label?: string }) {
  return (
    <Link href={`/?lang=${language}`} className={`${navLink} font-semibold text-ink-2 hover:bg-surface-2`}>
      <ArrowLeft size={14} aria-hidden="true" /> {label ?? (language === "en" ? "Back to feed" : "Akışa dön")}
    </Link>
  );
}

export function VisitorFooter({ language, siteName }: { language: VisitorLanguage; siteName: string }) {
  return (
    <footer className="visitor-footer visitor-muted mt-2 border-t border-line-strong px-2 pt-7 text-[13px] font-medium text-muted">
      <span>© {new Date().getFullYear()} {siteName}</span>
      <Link href={`/hakkinda?lang=${language}`} className="ml-4 rounded-sm hover:text-ink">
        {language === "en" ? "About & contact" : "Hakkında ve iletişim"}
      </Link>
    </footer>
  );
}
