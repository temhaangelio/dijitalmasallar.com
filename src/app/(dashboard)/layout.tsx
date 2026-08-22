import { redirect } from "next/navigation";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getAuthorizedAdminClient();
  if (!access) redirect("/giris");
  return children;
}
