"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile";

export async function updateProfileAction(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, message: parsed.error.issues[0]?.message ?? "Profil bilgilerini kontrol edin." };
  const supabase = await createClient();
  const [{ data: userData }, { data: isAdmin }] = await Promise.all([supabase.auth.getUser(), supabase.rpc("is_admin")]);
  if (!userData.user || isAdmin !== true) return { success: false as const, message: "Yönetici yetkisi gerekli." };
  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });
  if (error) return { success: false as const, message: "Profil güncellenemedi. Lütfen tekrar deneyin." };
  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return { success: true as const, message: "Profil bilgileriniz güncellendi." };
}
