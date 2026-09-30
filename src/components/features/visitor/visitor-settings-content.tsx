"use client";

import { ChevronDown, RotateCcw, Smartphone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref } from "@/lib/visitor-language";
import { resetReading } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { InstallPrompt, PushToggle } from "@/components/features/visitor/push";
import { resetTheme, ThemePicker } from "@/components/features/visitor/theme";
import type { VisitorLanguage } from "@/lib/visitor-language";

export default function VisitorSettingsContent({ language, pushPublicKey, onClose }: {
  language: VisitorLanguage;
  pushPublicKey: string;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isEnglish = language === "en";
  return (
    <section className="visitor-settings visitor-sans text-left" aria-label={isEnglish ? "Menu" : "Menü"}>
      {/* The sections first, then the settings. */}
      <nav className="feed-menu-nav" aria-label={isEnglish ? "Sections" : "Bölümler"}>
        {visitorNavItems.map((item) => <Link key={item.href} href={languageHref(item.href, language)} aria-current={pathname === item.href ? "page" : undefined} onClick={onClose} className="feed-menu-link">{item[language]}</Link>)}
        <Link href={languageHref("/favoriler", language)} aria-current={pathname === "/favoriler" ? "page" : undefined} onClick={onClose} className="feed-menu-link">{isEnglish ? "Favorites" : "Favoriler"}</Link>
      </nav>
      <div className="visitor-settings-section">
        <div className="visitor-settings-row">
          <h3 className="visitor-settings-label">{isEnglish ? "Theme" : "Tema"}</h3>
          <ThemePicker language={language} />
        </div>
      </div>
      <div className="visitor-settings-extra feed-settings-extra">
        <div className="visitor-settings-row">
          <h3 className="visitor-settings-label">{isEnglish ? "Language" : "Dil"}</h3>
          <LanguagePicker language={language} path={pathname} onNavigate={onClose} />
        </div>
        {pushPublicKey ? (
          <div className="visitor-settings-row">
            <h3 className="visitor-settings-label">{isEnglish ? "Notifications" : "Bildirimler"}</h3>
            <PushToggle language={language} publicKey={pushPublicKey} />
          </div>
        ) : null}
        <details className="group/install feed-settings-install">
          <summary className="feed-settings-install-summary visitor-sans cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="visitor-settings-label">{isEnglish ? "Home screen" : "Ana ekran"}</span>
            <span className="feed-settings-install-toggle">
              <Smartphone size={15} strokeWidth={1.7} aria-hidden="true" />
              {isEnglish ? "How to add" : "Nasıl eklenir?"}
              <ChevronDown size={15} className="transition-transform group-open/install:rotate-180" aria-hidden="true" />
            </span>
          </summary>
          <div className="feed-settings-install-help"><InstallPrompt language={language} /></div>
        </details>
      </div>
      <div className="visitor-settings-footer feed-settings-footer">
        <button type="button" onClick={() => { resetTheme(); resetReading(); }} className="visitor-settings-action visitor-settings-reset" aria-label={isEnglish ? "Reset appearance" : "Görünümü sıfırla"} title={isEnglish ? "Reset appearance" : "Görünümü sıfırla"}>
          <RotateCcw size={16} className="shrink-0" aria-hidden="true" />
          {isEnglish ? "Reset appearance" : "Görünümü sıfırla"}
        </button>
      </div>
    </section>
  );
}
