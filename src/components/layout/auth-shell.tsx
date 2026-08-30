import Link from "next/link";

export function AuthShell({ title, children, footer }: { title: string; note: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="admin-page grid min-h-screen place-items-center bg-canvas px-4 py-8 sm:py-12">
      <section className="w-full max-w-[460px] rounded-card border border-line bg-surface-2/35 p-6 sm:p-9">
        <h1 className="sr-only">{title}</h1>
        <Link href="/" className="mb-9 inline-flex items-center gap-3 rounded-full pr-3 text-ink transition-opacity hover:opacity-70">
          <span className="brand-mark" aria-hidden="true" />
          <strong className="text-[15px] font-semibold">diji.news</strong>
        </Link>
        {children}
        {footer ? <div className="mt-7 border-t border-line pt-6 text-center text-sm text-ink-2">{footer}</div> : null}
      </section>
    </main>
  );
}
