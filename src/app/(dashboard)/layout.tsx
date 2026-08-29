import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebarScript } from "@/components/layout/sidebar-toggle";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function DashboardLayout({ children, modal }: LayoutProps<"/">) {
  const access = await getAuthorizedAdminClient();
  if (!access) redirect("/giris");
  // Ahead of the children so the attribute is set before the browser parses the sidebar.
  return <><AdminSidebarScript />{children}{modal}</>;
}
