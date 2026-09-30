import type { Metadata } from "next";
import { FavoritesList } from "@/components/features/visitor/favorites-list";
import { VisitorShell } from "@/components/layout/visitor-shell";
import { VisitorPageHeading } from "@/components/features/visitor/page-heading";
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
    <VisitorShell language={language} siteName={settings.siteName}>
      <main className="feed-column feed-page w-full">
        <VisitorPageHeading title={language === "en" ? "Favorites" : "Favoriler"} lede={language === "en" ? "Notes you want to return to. Saved in this browser." : "Dönüp okumak istediğin notlar. Bu tarayıcıda saklanır."} />
        <FavoritesList language={language} />
      </main>
    </VisitorShell>
  );
}
