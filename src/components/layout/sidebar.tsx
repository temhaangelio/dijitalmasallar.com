import Link from "next/link";
import { ArrowUpRight, ChartColumn, FileText, LayoutDashboard, Mail, Megaphone, Rss, Settings2, Sparkles } from "lucide-react";
import { SidebarToggle } from "./sidebar-toggle";

/**
 * Every row carries an icon because the sidebar can be collapsed to icons alone — see the
 * `[data-admin-sidebar="collapsed"]` rules in globals.css, which do the collapsing in CSS so the
 * width is already correct on the first paint.
 *
 * `aria-label` repeats the label on purpose: the visible text is `display: none` while collapsed,
 * which would otherwise leave the link with no accessible name at all.
 */
const items = [
  ["Dashboard", "/dashboard", null, LayoutDashboard],
  ["Yazılar", "/yazilar", "posts", FileText],
  ["RSS", "/rss", "rss", Rss],
  ["Yapay Zekâ", "/yapay-zeka", "ai", Sparkles],
  ["E-bülten", "/e-bulten", "newsletter", Mail],
  ["Reklamlar", "/reklamlar", "ads", Megaphone],
  ["İstatistik", "/istatistik", "analytics", ChartColumn],
  ["Ayarlar", "/ayarlar", null, Settings2],
] as const;

export function Sidebar({ active, siteName, modules }: { active: string; siteName: string; modules: Record<"posts" | "rss" | "ai" | "newsletter" | "ads" | "analytics", boolean> }) {
  return <aside className="sidebar">
    <Link href="/dashboard" aria-label={siteName} className="flex items-center gap-3">
      <span className="brand-mark shrink-0" aria-hidden="true" /><strong className="sidebar-expanded-only block truncate text-base tracking-[-.03em]">{siteName}</strong>
    </Link>
    <nav className="flex flex-col gap-1">
      {items.filter(([, , module]) => !module || modules[module]).map(([label, href, , Icon]) => {
        const selected = active === href || (href === "/ayarlar" && active.startsWith("/ayarlar/"));
        return <Link key={href} href={href} aria-label={label} title={label} className={`sidebar-item relative text-[15px] transition-colors ${selected ? "bg-ink font-semibold text-white" : "font-medium text-ink-2 hover:bg-white hover:text-ink"}`}>
          <Icon size={18} className="shrink-0" aria-hidden="true" />
          <span className="sidebar-expanded-only truncate">{label}</span>
          {selected && <span aria-hidden="true" className="sidebar-expanded-only absolute right-3 top-2 size-1.5 rounded-full bg-white" />}
        </Link>;
      })}
      <Link href="/" aria-label="Siteyi gör" title="Siteyi gör" className="sidebar-item mt-2 text-[15px] font-medium text-muted transition-colors hover:bg-white hover:text-ink">
        <ArrowUpRight size={18} className="shrink-0" aria-hidden="true" />
        <span className="sidebar-expanded-only truncate">Siteyi gör</span>
      </Link>
    </nav>
    <SidebarToggle />
  </aside>;
}
