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
  return <AppShell active="/ayarlar"><div className="mx-auto w-full max-w-[1200px]"><Link href="/ayarlar" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#777] hover:text-black"><ArrowLeft size={16} /> Ayarlara dön</Link><PageHeader title={labels[section].title} note={labels[section].note} /><nav aria-label="Ayar bölümleri" className="mx-auto mb-5 flex w-full max-w-[920px] gap-2 overflow-x-auto rounded-[22px] bg-white p-2">{sections.map((item) => <Link key={item.id} href={item.href} aria-current={section === item.id ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-semibold transition ${section === item.id ? "bg-black text-white" : "text-[#777] hover:bg-[#f3f3f3] hover:text-black"}`}>{item.label}</Link>)}</nav><SettingsForm key={section} initialValues={settings} section={section} /></div></AppShell>;
}
