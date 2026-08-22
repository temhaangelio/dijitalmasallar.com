import Link from "next/link";

const items = [
  ["Dashboard", "/dashboard", ""], ["Yazılar", "/yazilar", ""], ["E-bülten", "/e-bulten", ""],
  ["Reklamlar", "/reklamlar", ""], ["İstatistik", "/istatistik", ""], ["Ayarlar", "/ayarlar", ""],
  ["Profil", "/profil", ""],
];

export function Sidebar({ active }: { active: string }) {
  return <aside className="sidebar">
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="brand-mark" /><strong className="block text-base tracking-[-.03em]">diji.news</strong>
    </Link>
    <nav className="flex flex-col gap-1">
      {items.map(([label, href, count]) => <Link key={href} href={href} className={`relative flex h-11 items-center justify-between rounded-[14px] px-4 text-[15px] transition-colors ${active === href ? "bg-black font-semibold text-white" : "font-medium text-[#4a4a4a] hover:bg-white hover:text-black"}`}><span>{label}</span>{active === href && <span aria-hidden="true" className="absolute right-3 top-2 size-1.5 rounded-full bg-white" />}{count && <span className={`text-[13px] ${active === href ? "text-white" : "text-[#a1a1a1]"}`}>{count}</span>}</Link>)}
      <Link href="/" className="mt-2 flex h-11 items-center justify-between rounded-[14px] px-4 text-[15px] font-medium text-[#a1a1a1] hover:bg-white hover:text-black"><span>Siteyi gör</span><span>↗</span></Link>
    </nav>
  </aside>;
}
