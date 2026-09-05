"use client";

import { usePathname } from "next/navigation";
import { AccentPicker } from "@/components/features/visitor/accent-picker";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { InstallPrompt, PushToggle } from "@/components/features/visitor/push";
import { ThemePicker } from "@/components/features/visitor/theme";
import type { VisitorLanguage } from "@/lib/visitor-language";

export default function VisitorSettingsContent({ language, pushPublicKey, onClose }: {
  language: VisitorLanguage;
  pushPublicKey: string;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isEnglish = language === "en";
  return (
        <section className="visitor-settings space-y-5 text-left" aria-label={isEnglish ? "Settings" : "Ayarlar"}>
          <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-ink-2">{isEnglish ? "Language" : "Dil"}</h3>
            <LanguagePicker language={language} path={pathname} onNavigate={onClose} />
          </div>
          <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-ink-2">{isEnglish ? "Appearance" : "Görünüm"}</h3>
            <ThemePicker language={language} />
          </div>
          <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-ink-2">{isEnglish ? "Accent color" : "Vurgu rengi"}</h3>
            <AccentPicker language={language} />
          </div>
          <div className="space-y-4 border-t border-line pt-4">
            {pushPublicKey ? (
              <div className="space-y-2">
                <h3 className="text-[13px] font-medium text-ink-2">{isEnglish ? "Notifications" : "Bildirimler"}</h3>
                <PushToggle language={language} publicKey={pushPublicKey} />
              </div>
            ) : null}
            <details className="group/install">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-[13px] text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                {isEnglish ? "Add to home screen" : "Ana ekrana ekle"}
                <span className="text-lg leading-none group-open/install:hidden" aria-hidden="true">+</span>
                <span className="hidden text-lg leading-none group-open/install:inline" aria-hidden="true">−</span>
              </summary>
              <div className="pb-1 pt-1"><InstallPrompt language={language} /></div>
            </details>
          </div>
        </section>
  );
}
