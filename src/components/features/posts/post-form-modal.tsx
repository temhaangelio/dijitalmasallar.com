"use client";

import { useRouter } from "next/navigation";
import { AppDialog } from "@/components/ui/app-dialog";

export function PostFormModal({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AppDialog
      title={title}
      onClose={() => router.back()}
      hideIdentity
      panelClassName="max-h-[calc(100dvh-2rem)] !max-w-[1200px] overflow-y-auto !bg-canvas lg:p-8"
    >
      <div className="mt-2">{children}</div>
    </AppDialog>
  );
}
