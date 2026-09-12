"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { deleteSubscriber, setSubscriberStatus } from "@/services/newsletter";

type ActionResult = { success: boolean; message: string };

const denied: ActionResult = { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };

function address(value: unknown) {
  return typeof value === "string" && value.includes("@") && value.length <= 254 ? value : null;
}

export async function setSubscriberStatusAction(email: unknown, subscribed: unknown): Promise<ActionResult> {
  if (!(await getAuthorizedAdminClient())) return denied;
  const target = address(email);
  if (!target) return { success: false, message: "Geçersiz e-posta adresi." };
  const status = subscribed === true ? "subscribed" : "unsubscribed";
  const done = await setSubscriberStatus(target, status);
  if (!done) return { success: false, message: "Durum güncellenemedi. Lütfen tekrar deneyin." };
  revalidatePath("/bulten");
  return { success: true, message: status === "subscribed" ? "Abonelik yeniden açıldı." : "Abonelik kapatıldı." };
}

export async function deleteSubscriberAction(email: unknown): Promise<ActionResult> {
  if (!(await getAuthorizedAdminClient())) return denied;
  const target = address(email);
  if (!target) return { success: false, message: "Geçersiz e-posta adresi." };
  const done = await deleteSubscriber(target);
  if (!done) return { success: false, message: "Kayıt silinemedi. Lütfen tekrar deneyin." };
  revalidatePath("/bulten");
  return { success: true, message: "Kayıt silindi." };
}
