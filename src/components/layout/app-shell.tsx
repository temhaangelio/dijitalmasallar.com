import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";

export function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  return <div className="shell"><Sidebar active={active} /><div className="min-w-0 flex-1"><MobileNavigation active={active} /><main className="main">{children}</main></div></div>;
}
