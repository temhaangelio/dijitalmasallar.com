import type { ReactNode } from "react";

export function VisitorContentPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="w-full max-w-[720px] pb-6 pt-12 sm:pt-16">
      <article className="visitor-panel overflow-hidden rounded-panel border border-line bg-surface">
        <header className="border-b border-line px-6 py-8 sm:px-10 sm:py-10">
          <h1 className="visitor-heading text-[length:var(--vt-h1)] font-semibold tracking-[-.045em]">{title}</h1>
          <p className="visitor-muted mt-3 max-w-[560px] text-[length:var(--vt-small)] leading-7 text-muted [text-wrap:pretty]">{intro}</p>
        </header>
        <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
      </article>
    </main>
  );
}
