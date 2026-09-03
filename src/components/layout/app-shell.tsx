import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { getSiteSettings } from "@/services/settings";
import { isRssReaderAvailable } from "@/lib/rss/availability";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { redirect } from "next/navigation";

type Modules = { posts: boolean; ai: boolean; rss: boolean; ads: boolean; analytics: boolean };

export async function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const modules: Modules = { posts: settings.modulePosts, ai: isLocalToolAvailable(), rss: settings.moduleRss && isRssReaderAvailable(), ads: settings.moduleAds, analytics: settings.moduleAnalytics };
  const routeModules: Record<string, keyof Modules> = { "/yazilar": "posts", "/yapay-zeka": "ai", "/rss": "rss", "/reklamlar": "ads", "/istatistik": "analytics" };
  const activeModule = routeModules[active];
  if (activeModule && !modules[activeModule]) redirect("/dashboard");
  return <div className="shell admin-page"><Sidebar active={active} siteName={settings.siteName} modules={modules} /><div className="min-w-0 flex-1"><MobileNavigation active={active} siteName={settings.siteName} modules={modules} /><main className="main">{children}</main></div></div>;
}
