import type { Metadata } from "next";
import { FavoritesList } from "@/components/features/visitor/favorites-list";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";
import { getPosts } from "@/services/posts";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const settings = await getSiteSettings();
  return {
    title: { absolute: `${language === "en" ? "Favorites" : "Favoriler"} · ${settings.siteName}` },
    robots: { index: false, follow: false },
  };
}

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = resolveVisitorLanguage((await searchParams).lang);
  const [settings, posts] = await Promise.all([getSiteSettings(), getPosts(1, 500, language)]);
  const isEnglish = language === "en";

  return (
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="mt-10 w-full max-w-[640px] sm:mt-14">
        <div className="mb-8 border-b border-line pb-5">
          <h1 className="visitor-heading text-[28px] font-bold leading-none tracking-[-.04em] text-ink">{isEnglish ? "Favorites" : "Favoriler"}</h1>
          <p className="mt-2 font-mono text-[11px] font-normal leading-none tracking-[.12em] text-muted">{isEnglish ? "Saved on this device" : "Bu cihazda kaydedilenler"}</p>
        </div>
        <FavoritesList posts={posts} language={language} />
      </main>
    </VisitorShell>
  );
}
