import Link from "next/link";

export function AuthShell({ title, note, children, footer }: { title: string; note: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center px-4 py-10"><section className="w-full max-w-[460px] rounded-card bg-white p-7 shadow-sm sm:p-10"><Link href="/" className="mb-10 flex items-center gap-3"><span className="brand-mark" aria-hidden="true" /><strong className="block">diji.news</strong></Link><h1 className="page-title !text-[32px]">{title}</h1><p className="mb-8 mt-3 text-[15px] leading-relaxed text-muted">{note}</p>{children}{footer && <div className="mt-7 border-t border-line pt-6 text-center text-sm text-ink-2">{footer}</div>}</section></main>;
}
