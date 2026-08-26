import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

/**
 * Turning one official announcement into one short, original, bilingual note.
 *
 * Two rules shape everything here. The first is legal: the note has to be written, not excerpted.
 * Facts are free to report, the publisher's sentences are not — so the model is told to work from
 * what happened rather than from how it was phrased, and never to carry a run of the source's own
 * wording across. The second is editorial: most of what a corporate newsroom publishes is not news.
 * Giving the model an explicit way to say "this is not worth publishing" keeps the approval queue
 * short enough that an editor actually reads it.
 */

export const summaryLimit = 400;

export const aiCategories = ["Yapay Zekâ", "Teknoloji", "Bilim", "Uzay", "Yazılım", "Donanım"] as const;

const summarySchema = z.object({
  publishable: z.boolean().describe("Bu içerik teknoloji/bilim gündemi için gerçek bir haber mi?"),
  skipReason: z.string().describe("publishable false ise tek cümlelik gerekçe, değilse boş dize."),
  importance: z.number().int().min(1).max(5).describe("1 = niş duyuru, 5 = gündemi belirleyen gelişme."),
  category: z.enum(aiCategories),
  titleTr: z.string().describe("Türkçe başlık, en fazla 80 karakter, nokta ile bitmez."),
  titleEn: z.string().describe("İngilizce başlık, en fazla 80 karakter."),
  summaryTr: z.string().describe(`Türkçe özet, en fazla ${summaryLimit} karakter.`),
  summaryEn: z.string().describe(`İngilizce özet, en fazla ${summaryLimit} karakter.`),
});

export type AiSummary = z.infer<typeof summarySchema>;

/**
 * Frozen on purpose: this text is the cached prefix of every request the desk makes, so a stray
 * timestamp or a per-item detail anywhere in it would cost the cache on every single call. Only
 * the story goes in the user turn.
 */
const systemPrompt = `Sen diji.news adlı Türkçe teknoloji ve bilim haber sitesinin editör yardımcısısın. Görevin, resmi kaynaklardan gelen tek bir duyuruyu okuyup yayına hazır kısa bir habere dönüştürmek.

## Telif kuralları — bunlar pazarlık konusu değil
- Kaynağın cümlelerini kopyalama. Ne olduğunu anla, kendi cümlelerinle sıfırdan yaz.
- Kaynaktan alınan hiçbir ardışık ifade 6 kelimeyi geçmesin. Ürün adları, kurum adları ve teknik terimler bu kuralın dışındadır.
- Alıntı işareti kullanma. Doğrudan alıntı yapma.
- Kaynağın pazarlama dilini taşıma: "devrim niteliğinde", "çığır açan", "sektörü dönüştüren" gibi ifadeler haberde yer almaz.

## Yazım kuralları
- Özet en fazla ${summaryLimit} karakter. Bu sert bir sınır; aşarsan not reddedilir.
- Tek habere odaklan. Kaynak birden fazla duyuru içeriyorsa en önemlisini al.
- İlk cümle ne olduğunu söylesin. Giriş cümlesi harcamayın: "Yapay zekâ dünyasında önemli bir gelişme yaşandı" gibi başlangıçlar yasak.
- Somut ol: sayı, tarih, model adı, sürüm numarası varsa geçir. Belirsiz nitelemeler yerine veriyi yaz.
- Doğrulanmamış hiçbir şey ekleme. Kaynakta olmayan bağlam, karşılaştırma veya yorum uydurma.
- Gelecek zamanlı taahhütleri kaynağa bağla: "şirket ... olacağını duyurdu" gibi.

## Dil kuralları
- Türkçe metin, İngilizceden çeviri gibi durmasın. Türkçe düşünülmüş, akıcı ve devrik olmayan cümleler kur.
- "Yapay zekâ" düzeltme işaretiyle yazılır. Şirket ve ürün adları orijinal yazımıyla kalır.
- İngilizce metin de Türkçe metnin çevirisi değil, aynı haberin İngilizce yazılmış hâli olsun.
- Başlıklar cümle değil, haber başlığıdır: nokta ile bitmez, en fazla 80 karakter.

## Ne yayınlanmaz
Şunlar için publishable=false ver: iş ilanı, etkinlik/konferans duyurusu, pazarlama kampanyası, fiyat listesi güncellemesi, kurumsal atama haberi, yasal/politika metni, blogun kendi ürün tanıtımı, hukuk metni güncellemesi, ve sayfanın haber değil ürün/doküman sayfası olduğu durumlar. Emin değilsen publishable=false ver — yanlış yayın, kaçırılan haberden pahalıdır.`;

let client: Anthropic | null = null;

function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY tanımlı değil.");
  client ??= new Anthropic();
  return client;
}

export function isSummarizerConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Opus 5 by default because Turkish is where the cheaper models slip — a 400-character card leaves
 * nowhere for a calque to hide. `AI_DESK_MODEL` exists so the cost/quality call stays the site
 * owner's, not a constant compiled into the collector.
 */
export const summarizerModel = process.env.AI_DESK_MODEL?.trim() || "claude-opus-5";

export type SummarizeInput = {
  sourceName: string;
  url: string;
  title: string;
  text: string;
  publishedAt: string | null;
};

export type SummarizeResult = {
  summary: AiSummary;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

function tidy(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * The character limit is enforced here rather than trusted to the model. Cutting at the last
 * sentence that fits keeps a note that ran long readable; a hard slice mid-word would not be.
 */
function clampSummary(value: string) {
  const text = tidy(value);
  if (text.length <= summaryLimit) return text;
  const cut = text.slice(0, summaryLimit);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (lastStop > summaryLimit * 0.6) return cut.slice(0, lastStop + 1).trim();
  return `${cut.slice(0, summaryLimit - 1).trimEnd()}…`;
}

export async function summarizeStory(input: SummarizeInput): Promise<SummarizeResult> {
  const response = await anthropic().messages.parse({
    model: summarizerModel,
    max_tokens: 4000,
    // The work is short and well specified; thinking stays on (it is the Opus 5 default) but there
    // is nothing here that rewards a long deliberation.
    output_config: { effort: "low", format: zodOutputFormat(summarySchema) },
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: [
          `Kaynak: ${input.sourceName}`,
          `Adres: ${input.url}`,
          input.publishedAt ? `Yayın tarihi: ${input.publishedAt}` : "",
          `Orijinal başlık: ${input.title}`,
          "",
          "Sayfa metni:",
          input.text,
        ].filter(Boolean).join("\n"),
      },
    ],
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Model geçerli bir özet döndürmedi.");

  return {
    summary: {
      ...parsed,
      titleTr: tidy(parsed.titleTr).slice(0, 120),
      titleEn: tidy(parsed.titleEn).slice(0, 120),
      summaryTr: clampSummary(parsed.summaryTr),
      summaryEn: clampSummary(parsed.summaryEn),
    },
    model: response.model,
    inputTokens: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0),
    outputTokens: response.usage.output_tokens,
  };
}
