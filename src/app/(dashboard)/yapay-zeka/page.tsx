import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { notFound } from "next/navigation";

export default function AiPage() {
  if (!isLocalToolAvailable()) notFound();

  return (
    <AppShell active="/yapay-zeka">
      <div className="mx-auto w-full max-w-[1600px]">
        <PageHeader title="Yapay zekâ" />
      </div>
    </AppShell>
  );
}
