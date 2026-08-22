import { NewsletterForm } from "@/components/features/newsletters/newsletter-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getNewsletterDashboard } from "@/services/newsletters";

export default async function NewNewsletterPage() {
  const { stats } = await getNewsletterDashboard();
  return <AppShell active="/e-bulten"><PageHeader title="Yeni bülten" note="İçeriği oluşturun, taslak kaydedin veya gönderimi planlayın." /><NewsletterForm activeSubscribers={stats.active} /></AppShell>;
}
