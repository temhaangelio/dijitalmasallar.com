import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageForm } from "@/components/features/pages/page-form";

export default function NewPagePage() {
  return <AppShell active="/sayfalar"><PageHeader title="Yeni sayfa" note="Türkçe ve İngilizce içerik oluşturun" /><PageForm /></AppShell>;
}
