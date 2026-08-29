import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNavigation } from "@/components/features/settings/settings-navigation";

export default function SettingsPage() {
  return <AppShell active="/ayarlar"><div className="mx-auto w-full max-w-[1200px]"><PageHeader title="Ayarlar" /><SettingsNavigation /></div></AppShell>;
}
