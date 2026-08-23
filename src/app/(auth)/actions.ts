"use server";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, loginSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export type AuthResult = { success: boolean; message: string };

export async function loginAction(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin." };
  if (!isSupabaseConfigured()) return { success: false, message: "Supabase bağlantısı henüz yapılandırılmamış." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { success: false, message: "E-posta veya şifre hatalı." };
  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || isAdmin !== true) {
    await supabase.auth.signOut();
    return { success: false, message: "Bu panele yalnızca yönetici hesabı giriş yapabilir." };
  }
  return { success: true, message: "Giriş yapıldı." };
}

export async function forgotPasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "E-posta adresini kontrol edin." };
  if (!isSupabaseConfigured()) return { success: false, message: "Supabase bağlantısı henüz yapılandırılmamış." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/sifre-yenile")}`,
  });
  if (error) {
    console.error("[auth/forgot-password] Reset request failed", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return { success: false, message: "Şifre yenileme bağlantısı gönderilemedi. Lütfen daha sonra tekrar deneyin." };
  }
  return { success: true, message: "Hesap bulunursa şifre yenileme bağlantısı gönderildi." };
}

export async function resetPasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Şifreleri kontrol edin." };
  if (!isSupabaseConfigured()) return { success: false, message: "Supabase bağlantısı henüz yapılandırılmamış." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  return error ? { success: false, message: "Şifre güncellenemedi. Bağlantıyı yeniden isteyin." } : { success: true, message: "Şifreniz güncellendi." };
}

export async function logoutAction() { if (isSupabaseConfigured()) { const supabase = await createClient(); await supabase.auth.signOut(); } redirect("/giris"); }
