import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AdForm } from "@/components/features/ads/ad-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getAdById } from "@/services/ads";

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await getAdById(id);
  if (!ad) notFound();
  return (
    <AppShell active="/reklamlar">
      <PageHeader title="Reklamı düzenle" actions={<Link href="/reklamlar" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="size-4" aria-hidden="true" />Reklamlara dön</Link>} />
      <AdForm ad={ad} />
    </AppShell>
  );
}
