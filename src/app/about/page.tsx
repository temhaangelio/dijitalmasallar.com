import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { FontPicker, FontSizePicker } from "@/components/features/visitor/font";
import { LanguagePicker } from "@/components/features/visitor/language-picker";
import { InstallPrompt, PushToggle } from "@/components/features/visitor/push";
import { ThemePicker } from "@/components/features/visitor/theme";
import { VisitorContentPage } from "@/components/features/visitor/visitor-content-page";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { isPushConfigured, pushPublicKey } from "@/services/push";
import { getSiteSettings } from "@/services/settings";
import type { ReactNode } from "react";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  return {
    title: { absolute: `${isEnglish ? "About" : "Hakkında"} · ${settings.siteName}` },
    description: isEnglish ? settings.descriptionEn : settings.description,
    alternates: { canonical: languageHref("/about", language), languages: { en: "/about", tr: "/about?lang=tr", "x-default": "/about" } },
  };
}

/** Each block of the page carries the same eyebrow-over-content shape, separated by a hairline. */
function Section({ title, children, first }: { title: string; children: ReactNode; first?: boolean }) {
  return (
    <section className={first ? "" : "mt-9 border-t border-line pt-8 sm:mt-10 sm:pt-9"} aria-label={title}>
      <h2 className="visitor-muted text-[length:var(--vt-eyebrow)] font-bold uppercase tracking-[.16em] text-faint">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const query = await searchParams;
  const language = resolveVisitorLanguage(query.lang);
  const settings = await getSiteSettings();
  const isEnglish = language === "en";
  const rssHref = isEnglish ? "/rss.xml" : "/rss.xml?lang=tr";
  const about = isEnglish ? settings.aboutTextEn || settings.descriptionEn : settings.aboutText || settings.description;
  const paragraphs = about.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const publicKey = settings.modulePush && isPushConfigured() ? pushPublicKey() : "";

  /*
   * The reader's own preferences live on this page rather than on one of their own: what the site is
   * and how the reader wants to see it are the same question asked twice, and splitting them left
   * two thin pages where one full one belongs. `/settings` redirects here.
   */
  const preferences = [
    { title: isEnglish ? "Language" : "Dil", description: isEnglish ? "Choose the language used across the site." : "Sitede kullanılacak dili seçin.", control: <LanguagePicker language={language} path="/about" /> },
    { title: isEnglish ? "Theme" : "Tema", description: isEnglish ? "System follows your device setting." : "Sistem seçeneği cihaz ayarınızı takip eder.", control: <ThemePicker language={language} /> },
    { title: isEnglish ? "Font" : "Yazı tipi", description: isEnglish ? "Choose the typeface used on visitor pages." : "Ziyaretçi sayfalarında kullanılacak yazı tipini seçin.", control: <FontPicker language={language} /> },
    { title: isEnglish ? "Font size" : "Yazı boyutu", description: isEnglish ? "Adjust the reading size across the site." : "Sitedeki okuma boyutunu ayarlayın.", control: <FontSizePicker language={language} /> },
    ...(publicKey ? [{
      title: isEnglish ? "Notifications" : "Bildirimler",
      description: isEnglish ? "Get a notification when a new note is published." : "Yeni bir not yayınlandığında bildirim alın.",
      control: <PushToggle language={language} publicKey={publicKey} />,
    }] : []),
    {
      title: isEnglish ? "App" : "Uygulama",
      description: isEnglish ? "Install diji.news to your home screen." : "diji.news'i ana ekranınıza uygulama olarak ekleyin.",
      control: <InstallPrompt language={language} />,
    },
  ];

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <VisitorContentPage
        title={isEnglish ? "About" : "Hakkında"}
        intro={isEnglish
          ? "A closer look at diji.news, and the settings that decide how you read it."
          : "diji.news'i ve akışın arkasındaki yaklaşımı tanıyın; okuma tercihlerinizi buradan ayarlayın."}
      >
        <Section title={isEnglish ? "What we do" : "Ne yapıyoruz"} first>
          <div className="space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 24)}-${index}`} className="visitor-copy text-[length:var(--vt-lead)] font-normal leading-[1.7] tracking-[-.018em] text-ink [text-wrap:pretty]">{paragraph}</p>
            ))}
          </div>
        </Section>

        <Section title={isEnglish ? "Page settings" : "Sayfa ayarları"}>
          <div className="-mt-1 divide-y divide-line">
            {preferences.map((row) => (
              <div key={row.title} className="flex flex-col items-stretch gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <strong className="visitor-copy block text-[length:var(--vt-small)] font-semibold">{row.title}</strong>
                  <p className="visitor-muted mt-1 text-[length:var(--vt-ui)] leading-6 text-muted">{row.description}</p>
                </div>
                {row.control}
              </div>
            ))}
          </div>
        </Section>

        <Section title={isEnglish ? "Follow the feed" : "Akışı takip edin"}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="visitor-muted text-[length:var(--vt-ui)] leading-6 text-muted [text-wrap:pretty]">
              {isEnglish ? "Every note, directly in your RSS reader." : "Her not doğrudan RSS okuyucunuza gelsin."}
            </p>
            <a href={rssHref} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-[length:var(--vt-ui)] font-semibold text-ink shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-all hover:-translate-y-px hover:bg-surface-2 hover:shadow-soft">
              <Rss className="size-4" aria-hidden="true" />RSS
            </a>
          </div>
        </Section>
      </VisitorContentPage>
    </VisitorShell>
  );
}
