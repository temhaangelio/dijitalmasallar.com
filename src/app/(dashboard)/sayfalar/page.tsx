import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PagesTable } from "@/components/features/pages/pages-table";
import { buttonVariants } from "@/components/ui/button";
import { getAdminPages } from "@/services/pages";

export default async function PagesPage() {
  const pages = await getAdminPages();
  return <AppShell active="/sayfalar"><PageHeader title="Sayfalar" note={`${pages.length} özel sayfa`} actions={<Link href="/sayfalar/yeni" className={buttonVariants()}>Yeni sayfa</Link>} /><PagesTable pages={pages} /></AppShell>;
}
