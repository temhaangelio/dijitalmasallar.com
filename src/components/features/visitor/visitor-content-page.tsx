import Link from "next/link";
import type { ReactNode } from "react";

export function VisitorContentPage({ title, intro, homeHref, homeLabel, children }: { title: string; intro: string; homeHref: string; homeLabel: string; children: ReactNode }) {
  return (
    <main className="w-full max-w-[640px] pb-6 pt-12 sm:pt-16">
      <article>
        <Link href={homeHref} aria-label={homeLabel} className="mb-8 block w-fit transition-opacity hover:opacity-75">
          <span className="brand-mark visitor-logo-mark block !size-20 !rounded-[24px] !p-5 after:!size-5 sm:!size-28 sm:!rounded-[32px] sm:!p-7 sm:after:!size-7" aria-hidden="true" />
        </Link>
        <header>
          <h1 className="visitor-heading text-[26px] font-normal leading-[1.3] tracking-normal sm:text-[30px]">{title}</h1>
          <p className="visitor-copy mt-2 max-w-[44ch] text-[16px] font-normal leading-[1.6] text-muted sm:text-[18px]">{intro}</p>
          <div className="mt-6 h-0.5 w-12 bg-ink" aria-hidden="true" />
        </header>
        <div className="mt-9 sm:mt-10">{children}</div>
      </article>
    </main>
  );
}
