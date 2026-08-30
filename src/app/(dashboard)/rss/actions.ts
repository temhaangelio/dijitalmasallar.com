"use server";

import { revalidatePath } from "next/cache";
import { isRssReaderAvailable } from "@/lib/rss/availability";
import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/utils";
import { addFeed, addPageSource, markAllRead, markItemRead, noFeedFoundMessage, refreshFeeds, removeFeed, removeReadItems, renameFeed, setFeedActive } from "@/services/rss";

type ActionResult = { success: boolean; message: string };
/** `canFollowPage` tells the dialog that scraping the page is still worth offering. */
type AddResult = ActionResult & { canFollowPage?: boolean };

/**
 * The feeds live in a local SQLite file rather than Supabase, but the gate on who may touch them is
 * still the Supabase session — otherwise these actions would be an unauthenticated HTTP endpoint.
 */
async function isAdmin() {
  return Boolean(await getAuthorizedAdminClient());
}

const forbidden: ActionResult = { success: false, message: "Bu işlem için yönetici yetkisi gerekir." };
const unavailable: ActionResult = { success: false, message: "RSS okuyucu yalnızca yerel geliştirme ortamında kullanılabilir." };

async function accessError() {
  if (!isRssReaderAvailable()) return unavailable;
  if (!await isAdmin()) return forbidden;
  return null;
}

/** Feed ids are UUIDs; item ids are the SHA-1 of the feed id and the entry's guid. */
function isItemId(value: string) {
  return /^[0-9a-f]{40}$/.test(value);
}

export async function addFeedAction(formData: FormData): Promise<AddResult> {
  const denied = await accessError();
  if (denied) return denied;
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { success: false, message: "Bir adres girin." };

  try {
    const { title, added } = await addFeed(url);
    revalidatePath("/rss");
    return { success: true, message: `“${title}” eklendi · ${added} içerik alındı.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kaynak eklenemedi.";
    return { success: false, message, canFollowPage: message === noFeedFoundMessage };
  }
}

/** The fallback for a page with no feed: follow the headings it links to. */
export async function addPageSourceAction(formData: FormData): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { success: false, message: "Bir adres girin." };

  try {
    const { title, added } = await addPageSource(url);
    revalidatePath("/rss");
    return { success: true, message: `“${title}” sayfa olarak eklendi · ${added} başlık alındı.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Sayfa takip edilemedi." };
  }
}

export async function refreshFeedsAction(feedId?: string): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (feedId && !isUuid(feedId)) return { success: false, message: "Geçersiz kaynak." };

  try {
    const { checked, added, failed } = await refreshFeeds(feedId);
    revalidatePath("/rss");
    if (!checked) return { success: false, message: "Yenilenecek etkin kaynak yok." };
    const failureNote = failed ? ` · ${failed} kaynak yanıt vermedi` : "";
    return { success: !failed, message: `${checked} kaynak tarandı · ${added} yeni içerik${failureNote}.` };
  } catch {
    return { success: false, message: "Kaynaklar yenilenemedi." };
  }
}

export async function removeFeedAction(feedId: string): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (!isUuid(feedId)) return { success: false, message: "Geçersiz kaynak." };
  removeFeed(feedId);
  revalidatePath("/rss");
  return { success: true, message: "Kaynak ve içerikleri silindi." };
}

export async function renameFeedAction(feedId: string, title: string): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (!isUuid(feedId)) return { success: false, message: "Geçersiz kaynak." };

  try {
    const name = renameFeed(feedId, title);
    revalidatePath("/rss");
    return { success: true, message: `Kaynak adı “${name}” olarak güncellendi.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Kaynak adı güncellenemedi." };
  }
}

export async function toggleFeedAction(feedId: string, active: boolean): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (!isUuid(feedId)) return { success: false, message: "Geçersiz kaynak." };
  setFeedActive(feedId, active);
  revalidatePath("/rss");
  return { success: true, message: active ? "Kaynak takibe alındı." : "Kaynak takipten çıkarıldı." };
}

export async function toggleItemReadAction(itemId: string, read: boolean): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (!isItemId(itemId)) return { success: false, message: "Geçersiz içerik." };
  markItemRead(itemId, read);
  // Do not revalidate here. In a Server Action, revalidatePath updates the open page immediately;
  // the unread query would then remove the row while keyboard focus is still travelling through
  // the list. RssItemsList mirrors this write locally, and the next deliberate refresh/navigation
  // reads the persisted value (and updates source badges) from SQLite.
  return { success: true, message: read ? "Okundu işaretlendi." : "Okunmadı işaretlendi." };
}

export async function markAllReadAction(feedId?: string): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (feedId && !isUuid(feedId)) return { success: false, message: "Geçersiz kaynak." };
  markAllRead(feedId);
  revalidatePath("/rss");
  return { success: true, message: "Tümü okundu işaretlendi." };
}

export async function removeReadItemsAction(feedId?: string): Promise<ActionResult> {
  const denied = await accessError();
  if (denied) return denied;
  if (feedId && !isUuid(feedId)) return { success: false, message: "Geçersiz kaynak." };
  const removed = removeReadItems(feedId);
  revalidatePath("/rss");
  return {
    success: true,
    message: removed ? `${removed} okunmuş içerik silindi.` : "Silinecek okunmuş içerik yok.",
  };
}
