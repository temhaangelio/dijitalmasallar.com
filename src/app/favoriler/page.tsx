import type { Metadata } from "next";
import { FavoritesList } from "@/components/features/visitor/favorites-list";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { resolveVisitorLanguage } from "@/lib/visitor-language";
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
  // No posts are fetched here any more: which notes are saved is only known to the reader's own
  // browser, so `FavoritesList` asks for exactly those. See `/api/favorites`.
  const settings = await getSiteSettings();

  return (
    <VisitorShell language={language} siteName={settings.siteName} compact>
      <main className="mt-6 w-full max-w-[640px] sm:mt-9">
        <header className="mb-6">
          <h1 className="visitor-serif text-[28px] leading-tight text-ink sm:text-[32px]">{language === "en" ? "Favorites" : "Favoriler"}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{language === "en" ? "Notes you want to return to. Saved in this browser." : "Dönüp okumak istediğin notlar. Bu tarayıcıda saklanır."}</p>
        </header>
        <FavoritesList language={language} />
      </main>
    </VisitorShell>
  );
}
