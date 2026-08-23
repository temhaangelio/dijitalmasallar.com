"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Segmented, segmentClassName } from "@/components/ui/segmented";

export const sections = [
  { label: "Genel", href: "/ayarlar/genel", title: "Genel ayarlar", note: "Site kimliği ve ziyaretçi akışı" },
  { label: "E-bülten", href: "/ayarlar/e-bulten", title: "E-bülten ayarları", note: "Abonelik alanının içeriği ve görünürlüğü" },
  { label: "Görünürlük", href: "/ayarlar/gorunurluk", title: "Görünürlük ayarları", note: "Ziyaretçilerin görebileceği sistem bilgileri" },
  { label: "Modüller", href: "/ayarlar/moduller", title: "Panel modülleri", note: "Yönetim panelinde kullanılacak özellikler" },
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
    <Segmented role="tablist" label="Ayar bölümleri" className="mb-5 w-full overflow-x-auto p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sections.map((section) => {
        const selected = section.href === active.href;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={selected ? "page" : undefined}
            data-active={selected}
            className={`${segmentClassName(selected)} h-11 flex-1 justify-center whitespace-nowrap px-4 text-sm`}
          >
            {section.label}
          </Link>
        );
      })}
    </Segmented>
  );
}

export function SettingsHeading() {
  const active = currentSection(usePathname());
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{active.title}</h1>
        <p className="page-note">{active.note}</p>
      </div>
    </header>
  );
}
