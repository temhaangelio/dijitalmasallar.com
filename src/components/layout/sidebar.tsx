import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/ui/brand-mark";
import { adminNavItems, type AdminModules } from "./admin-nav-items";
import { SidebarToggle } from "./sidebar-toggle";

/**
 * Every row carries an icon because the sidebar can be collapsed to icons alone — see the
 * `[data-admin-sidebar="collapsed"]` rules in globals.css, which do the collapsing in CSS so the
 * width is already correct on the first paint.
 *
 * `aria-label` repeats the label on purpose: the visible text is `display: none` while collapsed,
 * which would otherwise leave the link with no accessible name at all.
 */


export function Sidebar({ active, siteName, modules }: { active: string; siteName: string; modules: AdminModules }) {
  return <aside className="sidebar">
    <Link href="/dashboard" aria-label={siteName} className="flex items-center gap-3">
      <BrandMark className="shrink-0" /><strong className="admin-brand sidebar-expanded-only block truncate text-[14px]">{siteName}</strong>
    </Link>
    <nav aria-label="Yönetim menüsü" className="flex flex-col gap-1">
      {adminNavItems.filter(({ module }) => !module || modules[module]).map(({ label, href, icon: Icon }) => {
        const selected = active === href;
        return <Link key={href} href={href} aria-label={label} aria-current={selected ? "page" : undefined} title={label} className={`sidebar-item relative text-[15px] transition-colors ${selected ? "bg-surface-3 font-semibold text-ink" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"}`}>
          <Icon size={18} strokeWidth={1.6} className="shrink-0" aria-hidden="true" /><span className="sidebar-expanded-only truncate">{label}</span>
        </Link>;
      })}
    </nav>
    <div className="sidebar-footer mt-auto flex flex-col gap-1 border-t border-line/70 pt-4">
      <Link href="/" target="_blank" rel="noopener noreferrer" aria-label="Siteye git" title="Siteye git" className="sidebar-item w-full text-[15px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink">
        <ExternalLink size={18} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
        <span className="sidebar-expanded-only truncate">Siteye git</span>
      </Link>
      <div className="sidebar-footer-actions flex items-center gap-2">
        <form action={logoutAction} className="min-w-0 flex-1">
          <button type="submit" aria-label="Çıkış yap" title="Çıkış yap" className="sidebar-item w-full text-left text-[15px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <LogOut size={18} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
            <span className="sidebar-expanded-only truncate">Çıkış yap</span>
          </button>
        </form>
        <SidebarToggle />
      </div>
    </div>
  </aside>;
}
