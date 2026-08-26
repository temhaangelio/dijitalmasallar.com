"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/utils";
import { aiCategories, summaryLimit } from "@/lib/ai/summarize";
import { addSource, approveItem, collectStories, rejectItem, removeSource, retryItem, setSourceActive, summarizePending } from "@/services/ai-desk";
import { getSiteSettings } from "@/services/settings";

type ActionResult = { success: boolean; message: string };

const forbidden: ActionResult = { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
const disabled: ActionResult = { success: false, message: "Yapay zekâ modülü kapalı." };

/**
 * Every action re-checks the module switch as well as the session. Turning a module off in settings
 * has to actually stop it, not merely hide its link in the sidebar.
 */
type Access = { ok: false; error: ActionResult } | { ok: true; admin: NonNullable<Awaited<ReturnType<typeof getAuthorizedAdminClient>>> };

async function access(): Promise<Access> {
  const settings = await getSiteSettings();
  if (!settings.moduleAi) return { ok: false, error: disabled };
  const admin = await getAuthorizedAdminClient();
  if (!admin) return { ok: false, error: forbidden };
  return { ok: true, admin };
}

function refresh() {
  revalidatePath("/yapay-zeka");
}

function failure(cause: unknown, fallback: string): ActionResult {
  return { success: false, message: cause instanceof Error ? cause.message : fallback };
}

export async function addAiSourceAction(formData: FormData): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;

  const url = String(formData.get("url") ?? "").trim();
  const category = String(formData.get("category") ?? "Teknoloji").trim();
  if (!url) return { success: false, message: "Bir adres girin." };

  try {
    const { name, kind, added } = await addSource(url, category);
    refresh();
    const how = { feed: "akış", sitemap: "site haritası", page: "sayfa taraması" }[kind];
    return { success: true, message: `“${name}” eklendi · ${how} ile okunuyor · ${added} içerik kuyruğa alındı.` };
  } catch (cause) {
    return failure(cause, "Kaynak eklenemedi.");
  }
}

export async function removeAiSourceAction(id: string): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;
  if (!isUuid(id)) return { success: false, message: "Geçersiz kaynak." };

  try {
    await removeSource(id);
    refresh();
    return { success: true, message: "Kaynak ve içerikleri silindi." };
  } catch (cause) {
    return failure(cause, "Kaynak silinemedi.");
  }
}

export async function toggleAiSourceAction(id: string, active: boolean): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;
  if (!isUuid(id)) return { success: false, message: "Geçersiz kaynak." };

  try {
    await setSourceActive(id, active);
    refresh();
    return { success: true, message: active ? "Kaynak takibe alındı." : "Kaynak takipten çıkarıldı." };
  } catch (cause) {
    return failure(cause, "Kaynak güncellenemedi.");
  }
}

export async function collectNowAction(): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;

  try {
    const { checked, added, failed } = await collectStories();
    refresh();
    if (!checked) return { success: false, message: "Taranacak etkin kaynak yok." };
    const note = failed ? ` · ${failed} kaynak yanıt vermedi` : "";
    return { success: !failed, message: `${checked} kaynak tarandı · ${added} yeni içerik${note}.` };
  } catch (cause) {
    return failure(cause, "Kaynaklar taranamadı.");
  }
}

export async function summarizeNowAction(): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;

  try {
    const { processed, published, skipped, failed } = await summarizePending();
    refresh();
    if (!processed) return { success: false, message: "Özetlenecek yeni içerik yok." };
    const parts = [`${published} özet hazır`];
    if (skipped) parts.push(`${skipped} haber değeri yok`);
    if (failed) parts.push(`${failed} başarısız`);
    return { success: !failed, message: `${processed} içerik işlendi · ${parts.join(" · ")}.` };
  } catch (cause) {
    return failure(cause, "Özetler üretilemedi.");
  }
}

const approvalSchema = z.object({
  titleTr: z.string().trim().min(4, "Türkçe başlık en az 4 karakter olmalı.").max(120),
  titleEn: z.string().trim().min(4, "İngilizce başlık en az 4 karakter olmalı.").max(120),
  summaryTr: z.string().trim().min(20, "Türkçe özet en az 20 karakter olmalı.").max(summaryLimit, `Türkçe özet en fazla ${summaryLimit} karakter olmalı.`),
  summaryEn: z.string().trim().min(20, "İngilizce özet en az 20 karakter olmalı.").max(summaryLimit, `İngilizce özet en fazla ${summaryLimit} karakter olmalı.`),
  category: z.string().trim().min(1).max(60),
});

/**
 * The editor's edits are what gets published, not the model's original text — the form posts the
 * fields back so a note fixed in the queue is the note that goes live.
 */
export async function approveAiItemAction(id: string, input: unknown): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;
  if (!isUuid(id)) return { success: false, message: "Geçersiz içerik." };

  const parsed = approvalSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Notu kontrol edin." };

  try {
    await approveItem(id, gate.admin.user.id, parsed.data);
    refresh();
    revalidatePath("/");
    revalidatePath("/yazilar");
    return { success: true, message: "Haber yayınlandı." };
  } catch (cause) {
    return failure(cause, "Haber yayınlanamadı.");
  }
}

export async function rejectAiItemAction(id: string): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;
  if (!isUuid(id)) return { success: false, message: "Geçersiz içerik." };

  try {
    await rejectItem(id);
    refresh();
    return { success: true, message: "Haber reddedildi." };
  } catch (cause) {
    return failure(cause, "Haber güncellenemedi.");
  }
}

export async function retryAiItemAction(id: string): Promise<ActionResult> {
  const gate = await access();
  if (!gate.ok) return gate.error;
  if (!isUuid(id)) return { success: false, message: "Geçersiz içerik." };

  try {
    await retryItem(id);
    refresh();
    return { success: true, message: "İçerik yeniden kuyruğa alındı." };
  } catch (cause) {
    return failure(cause, "İçerik güncellenemedi.");
  }
}

export const availableCategories = aiCategories;
