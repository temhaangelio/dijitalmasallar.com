import Link from "next/link";

const items = [["Dashboard", "/dashboard"], ["Yazılar", "/yazilar"], ["E-bülten", "/e-bulten"], ["Reklamlar", "/reklamlar"], ["İstatistik", "/istatistik"], ["Ayarlar", "/ayarlar"], ["Profil", "/profil"]];

export function AdminLoadingShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar" aria-hidden="true">
        <div className="flex items-center gap-3"><span className="brand-mark" /><strong className="text-base tracking-[-.03em]">diji.news</strong></div>
        <nav className="flex flex-col gap-1">
          {items.map(([label, href]) => <div key={href} className={`flex h-11 items-center rounded-[14px] px-4 text-[15px] ${active === href ? "bg-black font-semibold text-white" : "font-medium text-[#4a4a4a]"}`}>{label}</div>)}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mobile-bar"><Link href="/dashboard" className="flex items-center gap-3"><span className="brand-mark !size-10" /><strong>diji.news</strong></Link></div>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
