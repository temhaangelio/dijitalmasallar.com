import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AdsManager } from "@/components/features/ads/ads-manager";
import { getAds } from "@/services/ads";

export default async function AdsPage() {
  const ads = await getAds();
  const active = ads.filter((ad) => ad.active).length;
  return <AppShell active="/reklamlar"><PageHeader title="Reklamlar" note={`${ads.length} reklam · ${active} yayında`} /><AdsManager ads={ads} /></AppShell>;
}
