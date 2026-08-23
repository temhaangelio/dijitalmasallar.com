import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdForm } from "@/components/features/ads/ad-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";

export default function NewAdPage() {
  return (
    <AppShell active="/reklamlar">
      <PageHeader
        title="Yeni reklam"
        note="Ziyaretçi akışında gösterilecek reklamı hazırlayın"
        actions={<Link href="/reklamlar" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="size-4" aria-hidden="true" />Reklamlara dön</Link>}
      />
      <AdForm />
    </AppShell>
  );
}
