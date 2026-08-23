import { notFound } from "next/navigation";
import { VisitorCmsPage } from "@/components/features/pages/visitor-page";
import { getVisitorLanguage } from "@/lib/visitor-language";
import { getPublishedPage, getPublishedPages } from "@/services/pages";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = await getVisitorLanguage((await searchParams).lang);
  const [page, pages, settings] = await Promise.all([getPublishedPage("hakkinda"), getPublishedPages(), getSiteSettings()]);
  if (!page) notFound();
  return <VisitorCmsPage language={language} page={page} pages={pages} siteName={settings.siteName} />;
}
