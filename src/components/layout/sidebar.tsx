import Link from "next/link";

const items = [
  ["Dashboard", "/dashboard", null], ["Yazılar", "/yazilar", "posts"], ["E-bülten", "/e-bulten", "newsletter"],
  ["Reklamlar", "/reklamlar", "ads"], ["İstatistik", "/istatistik", "analytics"], ["Ayarlar", "/ayarlar", null],
] as const;

export function Sidebar({ active, siteName, modules }: { active: string; siteName: string; modules: Record<"posts" | "newsletter" | "ads" | "analytics", boolean> }) {
  return <aside className="sidebar">
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="brand-mark" aria-hidden="true" /><strong className="block text-base tracking-[-.03em]">{siteName}</strong>
    </Link>
    <nav className="flex flex-col gap-1">
      {items.filter(([, , module]) => !module || modules[module]).map(([label, href]) => { const selected = active === href || (href === "/ayarlar" && active.startsWith("/ayarlar/")); return <Link key={href} href={href} className={`relative flex h-11 items-center justify-between rounded-chip px-4 text-[15px] transition-colors ${selected ? "bg-ink font-semibold text-white" : "font-medium text-ink-2 hover:bg-white hover:text-ink"}`}><span>{label}</span>{selected && <span aria-hidden="true" className="absolute right-3 top-2 size-1.5 rounded-full bg-white" />}</Link>; })}
      <Link href="/" className="mt-2 flex h-11 items-center justify-between rounded-chip px-4 text-[15px] font-medium text-muted hover:bg-white hover:text-ink"><span>Siteyi gör</span><span>↗</span></Link>
    </nav>
  </aside>;
}
