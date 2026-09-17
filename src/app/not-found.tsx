import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { defaultVisitorLanguage, languageHref } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

/** A page that does not exist is not a page to index, however nicely it is drawn. */
export const metadata: Metadata = {
  title: { absolute: "Sayfa bulunamadı · dijitalmasallar.com" },
  robots: { index: false, follow: true },
};

/**
 * The page a broken link lands on.
 *
 * Deliberately the quietest page on the site: a mark, a number, a line and a way back. The masthead
 * is left off — its navigation, its tagline and its binary rain are the site introducing itself,
 * and this is not the moment for that; the mark at the top is the way home and the link below it
 * says so in words.
 *
 * The number is set in the wordmark's monospace, at the size the eye lands on first, and the two
 * languages are stacked rather than laid out side by side: a 404 has no `?lang=` to read — the
 * address that produced it was wrong — so Turkish leads and English follows it, quietly.
 */
export default async function NotFound() {
  const settings = await getSiteSettings();
  const language = defaultVisitorLanguage;

  return (
    <VisitorShell language={language} siteName={settings.siteName} showHeader={false}>
      <main className="flex w-full max-w-[640px] flex-1 flex-col items-center justify-center py-24 text-center sm:py-32">
        <Link href={languageHref("/", language)} aria-label={`${settings.siteName} ana sayfa`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
          <BrandMark className="size-11 sm:size-12" />
        </Link>

        <p className="mt-12 font-[family-name:var(--font-visitor-mono)] text-[72px] font-light leading-none tracking-[-0.06em] text-ink sm:mt-16 sm:text-[96px]">404</p>

        <h1 className="visitor-sans mt-7 text-[19px] font-medium leading-tight text-ink sm:text-[21px]">Bu sayfa bulunamadı</h1>
        <p lang="en" className="visitor-sans mt-1.5 text-[14px] text-faint">Page not found</p>

        <Link
          href={languageHref("/", language)}
          className="visitor-sans mt-10 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-[6px] transition-colors hover:decoration-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Akışa dön
        </Link>
      </main>
    </VisitorShell>
  );
}
