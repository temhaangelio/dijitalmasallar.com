import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SubscribersList } from "@/components/features/newsletter/subscribers-list";
import { listNewsletterSubscribers } from "@/services/newsletter";

/** The list changes whenever a reader signs up, so it is never served from a cache. */
export const dynamic = "force-dynamic";

export default async function NewsletterAdminPage() {
  const { subscribers, total, unsubscribed, status } = await listNewsletterSubscribers();

  return (
    <AppShell active="/bulten">
      <PageHeader
        title="E-bülten"
        note="Kayıtlı adresler. Gönderim henüz yok; bu sayfa listeyi tutar ve dışa aktarır."
      />
      <Card className="mb-5 !p-0">
        <div className="grid grid-cols-3 divide-x divide-line">
          {[["Kayıtlı", total], ["Çıkmış", unsubscribed], ["Toplam", total + unsubscribed]].map(([label, value]) => (
            <div key={label} className="px-4 py-4 sm:px-5">
              <p className="text-[11px] text-muted">{label}</p>
              <strong className="mt-1.5 block text-[26px] font-medium leading-none tabular-nums tracking-tight sm:text-[30px]">{Number(value).toLocaleString("tr-TR")}</strong>
            </div>
          ))}
        </div>
      </Card>
      <SubscribersList subscribers={subscribers} status={status} />
    </AppShell>
  );
}
