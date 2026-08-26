import { SettingsForm } from "@/components/features/settings/settings-form";
import { getSiteSettings } from "@/services/settings";

export type SettingsSection = "general" | "visibility" | "modules";

/** The shell, heading and tab strip come from the sections layout; the page is only the form. */
export async function SettingsSectionPage({ section }: { section: SettingsSection }) {
  const settings = await getSiteSettings();
  return <SettingsForm key={section} initialValues={settings} section={section} />;
}
