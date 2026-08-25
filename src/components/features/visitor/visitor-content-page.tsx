import type { ReactNode } from "react";

export function VisitorContentPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="w-full max-w-[640px] pb-6 pt-12 sm:pt-16">
      <article className="rounded-[14px] border border-line/70 bg-surface/55 px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,.018)] sm:px-6 sm:py-6">
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
