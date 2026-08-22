import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/features/settings/settings-form";
import { getSiteSettings } from "@/services/settings";

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  const note = settings.updatedAt ? `Son kayıt ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(settings.updatedAt))}` : "Site ve ziyaretçi görünümü ayarları";
  return <AppShell active="/ayarlar"><PageHeader title="Ayarlar" note={note} /><SettingsForm initialValues={settings} /></AppShell>;
}
