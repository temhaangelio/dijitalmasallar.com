import Link from "next/link";
import { Plus } from "lucide-react";
import { AdsList } from "@/components/features/ads/ads-list";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getAds } from "@/services/ads";

export default async function AdsPage() {
  const ads = await getAds();
  return (
    <AppShell active="/reklamlar">
      <PageHeader
        title="Reklamlar"
        actions={<Link href="/reklamlar/yeni" className={buttonVariants()}><Plus className="size-4" aria-hidden="true" />Yeni reklam</Link>}
      />
      <AdsList ads={ads} />
    </AppShell>
  );
}
