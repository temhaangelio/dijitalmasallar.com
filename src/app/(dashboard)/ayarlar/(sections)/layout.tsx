import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SettingsHeading, SettingsTabs } from "@/components/features/settings/settings-tabs";
import { AppShell } from "@/components/layout/app-shell";

/**
 * The shell, the back link, the heading and the tab strip are shared by all four settings sections.
 * Keeping them in a layout means they are not rebuilt on every tab change — and the tab pill can
 * animate between positions, which is impossible when the whole nav remounts.
 */
export default function SettingsSectionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell active="/ayarlar">
      <div className="w-full">
        <Link href="/ayarlar" className="mb-4 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-muted transition-colors hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" /> Ayarlara dön
        </Link>
        <header className="mb-5 flex items-end justify-between gap-3 px-1">
          <SettingsHeading />
          <SettingsTabs />
        </header>
        {children}
      </div>
    </AppShell>
  );
}
