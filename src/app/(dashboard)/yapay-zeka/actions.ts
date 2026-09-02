"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createPostAction } from "@/app/(dashboard)/yazilar/actions";
import { dismissAiDiscovery, getAiCandidate, getAiDiscovery, setAiAgentInstructions, setAiCandidateStatus } from "@/lib/ai-news/local-db";
import { sourceForUrl } from "@/lib/ai-news/sources";
import { beginAiScan, finishAiScan, getAiScanState, type AiScanState } from "@/lib/ai-news/job";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/utils";
import { generateAiCandidate, scanOfficialAiNews } from "@/services/ai-news";

type ActionResult = { success: boolean; message: string };

async function authorizedAccess() {
  if (!isLocalToolAvailable()) return null;
  return getAuthorizedAdminClient();
}

export async function scanAiNewsAction(): Promise<ActionResult> {
  const access = await authorizedAccess();
  if (!access) return { success: false, message: "Bu araç yalnızca yerelde ve yönetici oturumuyla kullanılabilir." };
  const { data } = await access.admin.from("posts").select("source_url").not("source_url", "is", null).limit(2_000);
  const existingUrls = new Set((data ?? []).flatMap((row) => typeof row.source_url === "string" ? [row.source_url] : []));
  if (!beginAiScan()) return { success: false, message: "Haber taraması zaten arka planda çalışıyor." };
  after(async () => {
    try {
      const result = await scanOfficialAiNews(existingUrls);
      const shortage = result.eligible < result.requested ? ` · yalnızca ${result.eligible} uygun yeni kaynak bulundu` : "";
      const message = `${result.sourcesChecked} resmî kaynak tarandı · ${result.created}/${result.requested} hedef haber bulundu${shortage}.`;
      finishAiScan("completed", message);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Tarama tamamlanamadı.";
      finishAiScan("failed", rawMessage.includes("fetch failed") ? "DeepSeek API’ye ulaşılamadı. İnternet bağlantısını kontrol edin." : rawMessage);
    }
  });
  return { success: true, message: "Haber taraması arka planda başlatıldı." };
}

export async function getAiScanStateAction(): Promise<AiScanState> {
  if (!await authorizedAccess()) return { status: "failed", message: "Yetkisiz işlem.", startedAt: null, finishedAt: null };
  return getAiScanState();
}

export async function updateAiAgentInstructionsAction(instructions: string): Promise<ActionResult> {
  if (!await authorizedAccess()) return { success: false, message: "Bu işlem için yerel yönetici oturumu gerekir." };
  const normalized = instructions.replace(/\r\n?/g, "\n").trim();
  if (normalized.length < 40 || normalized.length > 4_000) return { success: false, message: "Ajan talimatı 40–4.000 karakter arasında olmalı." };
  setAiAgentInstructions(normalized);
  revalidatePath("/yapay-zeka");
  return { success: true, message: "Ajan talimatı güncellendi." };
}

export async function generateAiCandidateAction(id: string): Promise<ActionResult> {
  const access = await authorizedAccess();
  if (!access) return { success: false, message: "Bu işlem için yerel yönetici oturumu gerekir." };
  if (!isUuid(id) || !getAiDiscovery(id)) return { success: false, message: "Geçersiz haber başlığı." };
  try {
    await generateAiCandidate(id);
    revalidatePath("/yapay-zeka");
    return { success: true, message: "Haber taslağı hazırlandı ve onay listesine alındı." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Taslak oluşturulamadı." };
  }
}

export async function deleteAiDiscoveryAction(id: string): Promise<ActionResult> {
  const access = await authorizedAccess();
  if (!access) return { success: false, message: "Bu işlem için yerel yönetici oturumu gerekir." };
  if (!isUuid(id) || !getAiDiscovery(id)) return { success: false, message: "Geçersiz haber başlığı." };
  dismissAiDiscovery(id);
  revalidatePath("/yapay-zeka");
  return { success: true, message: "Haber başlığı listeden silindi." };
}

export async function publishAiCandidateAction(id: string): Promise<ActionResult> {
  const access = await authorizedAccess();
  if (!access) return { success: false, message: "Bu işlem için yerel yönetici oturumu gerekir." };
  if (!isUuid(id)) return { success: false, message: "Geçersiz taslak." };
  const candidate = getAiCandidate(id);
  if (!candidate || candidate.status !== "pending" || !sourceForUrl(candidate.sourceUrl)) return { success: false, message: "Taslak bulunamadı veya kaynak izinli değil." };

  const { count } = await access.admin.from("posts").select("id", { count: "exact", head: true }).eq("source_url", candidate.sourceUrl);
  if (count) return { success: false, message: "Bu kaynak daha önce yayınlanmış." };
  const result = await createPostAction({
    tr: { body: `# ${candidate.titleTr}\n\n${candidate.contentTr}` },
    en: { body: `# ${candidate.titleEn}\n\n${candidate.contentEn}` },
    sourceUrl: candidate.sourceUrl,
    featured: false,
    aiGeneratedImage: false,
    status: "published",
    scheduledAt: "",
    publishedAt: "",
  });
  if (!result.success) return result;
  setAiCandidateStatus(id, "published");
  revalidatePath("/yapay-zeka");
  return { success: true, message: "Taslak onaylandı ve yayına eklendi." };
}

export async function rejectAiCandidateAction(id: string): Promise<ActionResult> {
  const access = await authorizedAccess();
  if (!access) return { success: false, message: "Bu işlem için yerel yönetici oturumu gerekir." };
  if (!isUuid(id) || !getAiCandidate(id)) return { success: false, message: "Geçersiz taslak." };
  setAiCandidateStatus(id, "rejected");
  revalidatePath("/yapay-zeka");
  return { success: true, message: "Taslak reddedildi." };
}
