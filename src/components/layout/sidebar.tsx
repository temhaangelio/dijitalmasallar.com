import Link from "next/link";
import { Bot, ChartColumn, FileText, LayoutDashboard, LogOut, Megaphone, Rss } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/ui/brand-mark";
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
  ["Yapay zekâ", "/yapay-zeka", "ai", Bot],
  ["RSS", "/rss", "rss", Rss],
  ["Reklamlar", "/reklamlar", "ads", Megaphone],
  ["İstatistik", "/istatistik", "analytics", ChartColumn],
] as const;

export function Sidebar({ active, siteName, modules }: { active: string; siteName: string; modules: Record<"posts" | "ai" | "rss" | "ads" | "analytics", boolean> }) {
  return <aside className="sidebar">
    <Link href="/dashboard" aria-label={siteName} className="flex items-center gap-3">
      <BrandMark className="shrink-0" /><strong className="sidebar-expanded-only block truncate text-base tracking-[-.03em]">{siteName}</strong>
    </Link>
    <nav className="flex flex-col gap-1">
      {items.filter(([, , module]) => !module || modules[module]).map(([label, href, , Icon]) => {
        const selected = active === href;
        return <Link key={href} href={href} aria-label={label} title={label} className={`sidebar-item relative text-[15px] transition-colors ${selected ? "bg-ink font-semibold text-ink-contrast" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"}`}>
          <Icon size={18} className="shrink-0" aria-hidden="true" /><span className="sidebar-expanded-only truncate">{label}</span>
          {selected && <span aria-hidden="true" className="sidebar-expanded-only absolute right-3 top-2 size-1.5 rounded-full bg-ink-contrast" />}
        </Link>;
      })}
    </nav>
    <div className="sidebar-footer mt-auto flex items-center gap-2 border-t border-line/70 pt-4">
      <form action={logoutAction} className="min-w-0 flex-1">
        <button type="submit" aria-label="Çıkış yap" title="Çıkış yap" className="sidebar-item w-full text-left text-[15px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          <span className="sidebar-expanded-only truncate">Çıkış yap</span>
        </button>
      </form>
      <SidebarToggle />
    </div>
  </aside>;
}
