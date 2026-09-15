import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LocalChat } from "@/components/features/local-chat/local-chat";

export default function LocalAssistantPage() {
  return <AppShell active="/yerel-asistan">
    <PageHeader title="Yerel asistan" />
    <LocalChat />
  </AppShell>;
}
