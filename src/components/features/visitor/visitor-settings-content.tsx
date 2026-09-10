"use client";

import { useId, useState } from "react";
import { ChevronDown, RotateCcw, Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { AccentPicker, resetAccent } from "@/components/features/visitor/accent-picker";
import { FontPicker, resetReading, TextSizePicker } from "@/components/features/visitor/font";
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
  const [moreOpen, setMoreOpen] = useState(false);
  const panelId = useId();
  return (
    <section className="visitor-settings visitor-sans text-left" aria-label={isEnglish ? "Settings" : "Ayarlar"}>
      <div className="visitor-settings-section">
        <div className="visitor-settings-row">
          <h3 className="visitor-settings-label">{isEnglish ? "Theme" : "Tema"}</h3>
          <ThemePicker language={language} />
        </div>
        <div className="visitor-settings-row">
          <h3 className="visitor-settings-label">{isEnglish ? "Font" : "Yazı tipi"}</h3>
          <FontPicker language={language} />
        </div>
        <div className="visitor-settings-row">
          <h3 className="visitor-settings-label">{isEnglish ? "Size" : "Boyut"}</h3>
          <TextSizePicker language={language} />
        </div>
        <div className="visitor-settings-row visitor-settings-colors">
          <h3 className="visitor-settings-label">{isEnglish ? "Color" : "Renk"}</h3>
          <AccentPicker language={language} />
        </div>
      </div>
      <div className="visitor-settings-footer">
        <button type="button" aria-expanded={moreOpen} aria-controls={panelId} onClick={() => setMoreOpen(value => !value)} className="visitor-settings-more">
          {isEnglish ? "More settings" : "Diğer ayarlar"}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => { resetTheme(); resetReading(); resetAccent(); }} className="visitor-settings-action visitor-settings-reset" aria-label={isEnglish ? "Reset appearance" : "Görünümü sıfırla"} title={isEnglish ? "Reset appearance" : "Görünümü sıfırla"}>
          <RotateCcw size={16} className="shrink-0" aria-hidden="true" />
          {isEnglish ? "Reset" : "Sıfırla"}
        </button>
      </div>
      <div id={panelId} hidden={!moreOpen} className="visitor-settings-extra">
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
        <details className="group/install visitor-settings-install">
          <summary className="visitor-settings-action cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <Smartphone size={18} className="shrink-0" aria-hidden="true" />
            <span>{isEnglish ? "Add to home screen" : "Ana ekrana ekle"}</span>
            <ChevronDown size={18} className="ml-auto shrink-0 transition-transform group-open/install:rotate-180" aria-hidden="true" />
          </summary>
          <div className="visitor-settings-install-help"><InstallPrompt language={language} /></div>
        </details>
      </div>
    </section>
  );
}
