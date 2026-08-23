import Link from "next/link";
import { Blocks, ChevronRight, Eye, Mail, Settings2, UserRound } from "lucide-react";

const items = [
  { title: "Genel", description: "Site adı, açıklamalar, alan adı ve akış biçimi", href: "/ayarlar/genel", icon: Settings2 },
  { title: "E-bülten", description: "Ziyaretçi abonelik alanının metinleri ve görünürlüğü", href: "/ayarlar/e-bulten", icon: Mail },
  { title: "Görünürlük", description: "Abone sayısı ve bakım modu seçenekleri", href: "/ayarlar/gorunurluk", icon: Eye },
  { title: "Modüller", description: "Panelde kullanılacak özellikleri açın veya kapatın", href: "/ayarlar/moduller", icon: Blocks },
  { title: "Profil", description: "Admin hesabı ve güvenlik bilgileri", href: "/profil", icon: UserRound },
] as const;

export function SettingsNavigation() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} className="group flex min-h-32 items-center gap-5 rounded-card border border-ink/[0.05] bg-surface p-6 transition hover:-translate-y-0.5 hover:border-ink/10 hover:shadow-soft"><span className="grid size-14 shrink-0 place-items-center rounded-panel bg-surface-3 text-ink"><Icon size={22} /></span><span className="min-w-0 flex-1"><strong className="block text-[18px] tracking-[-.025em]">{item.title}</strong><span className="mt-1.5 block text-sm leading-5 text-muted">{item.description}</span></span><ChevronRight size={19} className="shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-ink" /></Link>;
      })}
    </div>
  );
}
