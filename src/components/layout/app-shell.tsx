import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { getSiteSettings } from "@/services/settings";
import { isRssReaderAvailable } from "@/lib/rss/availability";
import { redirect } from "next/navigation";

type Modules = { posts: boolean; rss: boolean; newsletter: boolean; ads: boolean; analytics: boolean };

export async function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const modules: Modules = { posts: settings.modulePosts, rss: settings.moduleRss && isRssReaderAvailable(), newsletter: settings.moduleNewsletter, ads: settings.moduleAds, analytics: settings.moduleAnalytics };
  const routeModules: Record<string, keyof Modules> = { "/yazilar": "posts", "/rss": "rss", "/e-bulten": "newsletter", "/reklamlar": "ads", "/istatistik": "analytics" };
  const activeModule = routeModules[active];
  if (activeModule && !modules[activeModule]) redirect("/dashboard");
  return <div className="shell"><Sidebar active={active} siteName={settings.siteName} modules={modules} /><div className="min-w-0 flex-1"><MobileNavigation active={active} siteName={settings.siteName} modules={modules} /><main className="main">{children}</main></div></div>;
}
