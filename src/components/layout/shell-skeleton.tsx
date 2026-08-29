import { ArrowUpRight, ChartColumn, FileText, LayoutDashboard, Megaphone, Rss, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/feedback/states";

const items = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Yazılar", "/yazilar", FileText],
  ["RSS", "/rss", Rss],
  ["Reklamlar", "/reklamlar", Megaphone],
  ["İstatistik", "/istatistik", ChartColumn],
  ["Ayarlar", "/ayarlar", Settings2],
] as const;

/**
 * `AppShell` is rendered by each page rather than by the dashboard layout, so `loading.tsx` replaces
 * the sidebar along with the page body. Without this stand-in the skeleton would sit on the bare
 * canvas and the content would jump 248px sideways once it arrived.
 *
 * The nav labels are static, so they are shown for real; only the site name — which comes from
 * settings and is not available yet — is a placeholder. A module that is switched off appears here
 * for the duration of the load, which costs no horizontal shift.
 */
export function ShellSkeleton({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="shell admin-page">
      <aside className="sidebar" aria-hidden="true">
        <div className="flex items-center gap-3">
          {/* The real brand mark is the one solid, fully-coloured thing on an otherwise grey page,
              so the placeholder copies its 40px box and 13px radius instead of the logo itself. */}
          <Skeleton className="size-10 shrink-0 rounded-[13px]" />
          <Skeleton className="sidebar-expanded-only h-4 w-24" />
        </div>
        <nav className="flex flex-col gap-1">
          {items.map(([label, href, Icon]) => (
            <div key={href} className={`sidebar-item text-[15px] ${active === href ? "bg-ink font-semibold text-ink-contrast" : "font-medium text-ink-2"}`}>
              <Icon size={18} className="shrink-0" />
              <span className="sidebar-expanded-only">{label}</span>
            </div>
          ))}
          <div className="sidebar-item mt-2 text-[15px] font-medium text-muted">
            <ArrowUpRight size={18} className="shrink-0" />
            <span className="sidebar-expanded-only">Siteyi gör</span>
          </div>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mobile-bar">
          <span className="flex items-center gap-3"><Skeleton className="size-10 shrink-0 rounded-[13px]" /><Skeleton className="h-4 w-24" /></span>
          <span className="grid size-11 place-items-center rounded-full bg-surface" aria-hidden="true" />
        </div>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
