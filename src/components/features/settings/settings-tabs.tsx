"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, Eye, Mail, Settings2 } from "lucide-react";
import { Segmented, segmentClassName } from "@/components/ui/segmented";

export const sections = [
  { label: "Genel", href: "/ayarlar/genel", title: "Genel ayarlar", note: "Site kimliği ve ziyaretçi akışı", icon: Settings2 },
  { label: "E-bülten", href: "/ayarlar/e-bulten", title: "E-bülten ayarları", note: "Abonelik alanının içeriği ve görünürlüğü", icon: Mail },
  { label: "Görünürlük", href: "/ayarlar/gorunurluk", title: "Görünürlük ayarları", note: "Ziyaretçilerin görebileceği sistem bilgileri", icon: Eye },
  { label: "Modüller", href: "/ayarlar/moduller", title: "Panel modülleri", note: "Yönetim panelinde kullanılacak özellikler", icon: Blocks },
] as const;

export function currentSection(pathname: string) {
  return sections.find((section) => pathname.startsWith(section.href)) ?? sections[0];
}

/**
 * Lives in the sections layout rather than in each page, so the component instance survives the
 * navigation between tabs — which is what lets the pill slide instead of jumping.
 */
export function SettingsTabs() {
  const active = currentSection(usePathname());
  return (
    <Segmented role="group" label="Ayar bölümleri" className="shrink-0 p-1">
      {sections.map((section) => {
        const selected = section.href === active.href;
        const Icon = section.icon;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-label={section.label}
            aria-current={selected ? "page" : undefined}
            title={section.label}
            data-active={selected}
            className={`${segmentClassName(selected)} size-10 justify-center p-0`}
          >
            <Icon size={18} aria-hidden="true" />
          </Link>
        );
      })}
    </Segmented>
  );
}

export function SettingsHeading() {
  const active = currentSection(usePathname());
  return (
    <div className="min-w-0">
      <h1 className="page-title">{active.title}</h1>
      <p className="page-note">{active.note}</p>
    </div>
  );
}
