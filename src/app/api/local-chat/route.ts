import { getAuthorizedAdminClient } from "@/lib/supabase/admin";
import { isLocalToolAvailable } from "@/lib/local-tools";
import { LOCAL_CHAT_MODEL, localChatSchema } from "@/lib/local-chat";

export const runtime = "nodejs";
export const maxDuration = 180;
const ollama = "http://127.0.0.1:11434";

export async function GET() {
  if (!isLocalToolAvailable()) return Response.json({ error: "Bu araç yalnızca yerelde kullanılabilir." }, { status: 404 });
  if (!await getAuthorizedAdminClient()) return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  try {
    const response = await fetch(`${ollama}/api/tags`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error("Ollama unavailable");
    const data = await response.json();
    const ready = Array.isArray(data.models) && data.models.some((model: { name: string }) => model.name === LOCAL_CHAT_MODEL);
    return Response.json({ ready, message: ready ? "Bağlı" : "Model bulunamadı. Terminalde ollama pull qwen3.5:9b çalıştırın." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ready: false, message: "Ollama’ya ulaşılamıyor. Ollama uygulamasını açıp tekrar deneyin." }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  if (!isLocalToolAvailable()) return Response.json({ error: "Bu araç yalnızca yerelde kullanılabilir." }, { status: 404 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!await getAuthorizedAdminClient()) return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  let body;
  try {
    const text = await request.text();
    if (text.length > 200000) return Response.json({ error: "Mesaj çok uzun." }, { status: 413 });
    body = localChatSchema.safeParse(JSON.parse(text));
  } catch { return Response.json({ error: "Mesaj okunamadı." }, { status: 400 }); }
  if (!body.success) return Response.json({ error: "Mesaj veya sohbet çok uzun. Mesajı kısaltın ya da yeni sohbet başlatın." }, { status: 400 });
  try {
    const response = await fetch(`${ollama}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(180000)]),
      body: JSON.stringify({ model: LOCAL_CHAT_MODEL, stream: true, think: false, keep_alive: "5m", options: { num_ctx: 16384, num_predict: 4096 }, messages: [
        { role: "system", content: "Dijital Masallar editörünün yardımcısısın. Kullanıcının istediği dilde, aksi belirtilmedikçe Türkçe yanıt ver. Açık, doğal ve özlü yaz. Verilen metni düzenlerken anlamını koru. İnternete erişimin yok; kaynakları ziyaret ettiğini veya güncel bilgileri doğruladığını iddia etme." }, ...body.data.messages,
      ] }),
    });
    if (!response.ok || !response.body) return Response.json({ error: response.status === 404 ? "Qwen modeli bulunamadı. Ollama kurulumunu kontrol edin." : "Ollama yanıt üretemedi. Tekrar deneyin." }, { status: 502 });
    return new Response(response.body, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
  } catch {
    return Response.json({ error: "Ollama bağlantısı kesildi veya zaman aşımına uğradı. Uygulamanın açık olduğunu kontrol edin." }, { status: 502 });
  }
}
