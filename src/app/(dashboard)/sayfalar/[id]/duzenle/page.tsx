import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageForm } from "@/components/features/pages/page-form";
import { getAdminPage } from "@/services/pages";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const page = await getAdminPage((await params).id);
  if (!page) notFound();
  return <AppShell active="/sayfalar"><PageHeader title="Sayfayı düzenle" note={page.title_tr || page.title_en} /><PageForm page={page} /></AppShell>;
}
