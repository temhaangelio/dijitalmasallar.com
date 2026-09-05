import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/brand-mark";

export function VisitorContentPage({ title, intro, homeHref, homeLabel, children }: { title: string; intro: string; homeHref: string; homeLabel: string; children: ReactNode }) {
  return (
    <main className="w-full max-w-[640px] pb-8 pt-12 sm:pt-16">
      <article>
        <Link href={homeHref} aria-label={homeLabel} className="block w-fit transition-opacity hover:opacity-75">
          <BrandMark className="visitor-logo-mark block !size-9 !rounded-[12px]" />
        </Link>
        <header className="mt-9 sm:mt-11">
          <h1 className="visitor-copy visitor-serif text-[26px] font-normal leading-[1.3] tracking-normal sm:text-[30px]">{title}</h1>
          <p className="mt-3 max-w-[44ch] visitor-sans text-[11px] font-medium uppercase leading-[1.7] tracking-[.16em] text-muted sm:text-[12px]">{intro}</p>
        </header>
        <div className="mt-8 sm:mt-9">{children}</div>
      </article>
    </main>
  );
}
