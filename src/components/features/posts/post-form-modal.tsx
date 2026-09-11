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
      panelClassName="admin-editor-dialog !max-w-[1200px] !bg-canvas lg:p-8"
    >
      <div className="mt-2">{children}</div>
    </AppDialog>
  );
}
