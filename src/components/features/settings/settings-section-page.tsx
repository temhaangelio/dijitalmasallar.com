import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SettingsForm } from "@/components/features/settings/settings-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getSiteSettings } from "@/services/settings";

type Section = "general" | "newsletter" | "visibility" | "modules";
const labels: Record<Section, { title: string; note: string }> = {
  general: { title: "Genel ayarlar", note: "Site kimliği ve ziyaretçi akışı" },
  newsletter: { title: "E-bülten ayarları", note: "Abonelik alanının içeriği ve görünürlüğü" },
  visibility: { title: "Görünürlük ayarları", note: "Ziyaretçilerin görebileceği sistem bilgileri" },
  modules: { title: "Panel modülleri", note: "Yönetim panelinde kullanılacak özellikler" },
};
const sections: Array<{ id: Section; label: string; href: string }> = [
  { id: "general", label: "Genel", href: "/ayarlar/genel" },
  { id: "newsletter", label: "E-bülten", href: "/ayarlar/e-bulten" },
  { id: "visibility", label: "Görünürlük", href: "/ayarlar/gorunurluk" },
  { id: "modules", label: "Modüller", href: "/ayarlar/moduller" },
];

export async function SettingsSectionPage({ section }: { section: Section }) {
  const settings = await getSiteSettings();
  return <AppShell active="/ayarlar"><div className="w-full"><Link href="/ayarlar" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Ayarlara dön</Link><PageHeader title={labels[section].title} note={labels[section].note} /><nav aria-label="Ayar bölümleri" className="mb-5 flex w-full gap-2 overflow-x-auto rounded-panel bg-surface p-2">{sections.map((item) => <Link key={item.id} href={item.href} aria-current={section === item.id ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-field px-4 text-sm font-semibold transition ${section === item.id ? "bg-ink text-white" : "text-muted hover:bg-surface-3 hover:text-ink"}`}>{item.label}</Link>)}</nav><SettingsForm key={section} initialValues={settings} section={section} /></div></AppShell>;
}
