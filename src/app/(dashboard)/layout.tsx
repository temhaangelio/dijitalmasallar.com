import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getAuthorizedAdminClient();
  if (!access) redirect("/giris");
  return children;
}
