import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisitorCmsPage } from "@/components/features/pages/visitor-page";
import { getVisitorLanguage } from "@/lib/visitor-language";
import { getPublishedPage, getPublishedPages, localizedPage } from "@/services/pages";
import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const language = await getVisitorLanguage(query.lang);
  const [page, settings] = await Promise.all([getPublishedPage(slug), getSiteSettings()]);
  if (!page) return {};
  return { title: `${localizedPage(page, language).title} · ${settings.siteName}` };
}

export default async function PublicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const language = await getVisitorLanguage(query.lang);
  const [page, pages, settings] = await Promise.all([getPublishedPage(slug), getPublishedPages(), getSiteSettings()]);
  if (!page) notFound();
  return <VisitorCmsPage language={language} page={page} pages={pages} siteName={settings.siteName} />;
}
