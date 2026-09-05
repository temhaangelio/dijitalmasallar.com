import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { getSiteSettings } from "@/services/settings";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { redirect } from "next/navigation";

type Modules = { posts: boolean; rss: boolean; ads: boolean; analytics: boolean };

export async function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const localToolsAvailable = isLocalToolAvailable();
  const modules: Modules = { posts: settings.modulePosts, rss: settings.moduleRss && localToolsAvailable, ads: settings.moduleAds, analytics: settings.moduleAnalytics };
  const routeModules: Record<string, keyof Modules> = { "/yazilar": "posts", "/rss": "rss", "/reklamlar": "ads", "/istatistik": "analytics" };
  const activeModule = routeModules[active];
  if (activeModule && !modules[activeModule]) redirect("/dashboard");
  return <div className="shell admin-page"><a href="#admin-content" className="admin-skip-link">İçeriğe geç</a><Sidebar active={active} siteName={settings.siteName} modules={modules} /><div className="min-w-0 flex-1"><MobileNavigation active={active} siteName={settings.siteName} modules={modules} /><main id="admin-content" tabIndex={-1} className="main">{children}</main></div></div>;
}
