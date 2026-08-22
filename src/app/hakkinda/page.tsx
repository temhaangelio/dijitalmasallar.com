import type { Metadata } from "next";
import Link from "next/link";
import { VisitorPreferences, VisitorThemeSync } from "@/components/features/visitor/visitor-preferences";
import { getVisitorLanguage } from "@/lib/visitor-language";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: `Hakkında · ${settings.siteName}`, description: settings.description };
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);
  const language = await getVisitorLanguage(params.lang);

  return (
    <div className="visitor-page flex min-h-screen flex-col items-center bg-[#efefef] px-5 pb-12 pt-5 text-[#0a0a0a]">
      <VisitorThemeSync />
      <nav className="visitor-nav flex w-full max-w-[720px] items-center justify-between gap-4 py-2.5">
        <Link href={`/?lang=${language}`} className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-[30px] items-start justify-start rounded-[10px] bg-[#0a0a0a] p-[7px]"><span className="size-[7px] rounded-full bg-white" /></span>
          <span className="visitor-heading text-[15px] font-bold tracking-[-.03em]">{settings.siteName}</span>
        </Link>
        <Link href={`/?lang=${language}`} className="flex h-[34px] items-center rounded-full bg-[#0a0a0a] px-4 text-sm font-semibold text-white">
          {language === "en" ? "Feed" : "Akış"}
        </Link>
      </nav>

      <main className="flex w-full max-w-[720px] flex-col gap-3 pt-10">
        <section className="visitor-panel rounded-[24px] border border-[#e7e7e7] bg-white p-6 sm:p-8">
          <span className="visitor-muted text-[11px] font-bold tracking-[.16em] text-[#a1a1a1]">{language === "en" ? "ABOUT" : "HAKKINDA"}</span>
          <h1 className="visitor-heading mt-4 text-[28px] font-bold tracking-[-.045em] sm:text-[34px]">{settings.siteName}</h1>
          <p className="visitor-copy mt-4 max-w-[590px] text-[16px] font-medium leading-[1.7] text-[#555] [text-wrap:pretty]">
            {language === "en" ? `${settings.descriptionEn} Posts are presented briefly and with their sources so you can follow developments quickly.` : `${settings.description} Paylaşımlar, gelişmeleri hızlıca takip edebilmeniz için kısa ve kaynaklarıyla birlikte sunulur.`}
          </p>
        </section>

        <VisitorPreferences language={language} />

        <section className="visitor-panel rounded-[24px] border border-[#e7e7e7] bg-white p-6 sm:p-8">
          <span className="visitor-muted text-[11px] font-bold tracking-[.16em] text-[#a1a1a1]">{language === "en" ? "CONTACT" : "İLETİŞİM"}</span>
          <h2 className="visitor-heading mt-4 text-xl font-bold tracking-[-.035em]">
            {language === "en" ? "Get in touch" : "Bize ulaşın"}
          </h2>
          <p className="visitor-copy mt-2 max-w-[560px] text-sm font-medium leading-relaxed text-[#777]">
            {language === "en" ? "You can email us with your questions, suggestions, or feedback." : "Soru, öneri veya geri bildirimleriniz için e-posta gönderebilirsiniz."}
          </p>
          <a href={`mailto:${settings.contactEmail}`} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#0a0a0a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#262626]">
            {settings.contactEmail}
          </a>
        </section>
      </main>
    </div>
  );
}
