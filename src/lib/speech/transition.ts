import { speechClosing } from "./script-text.ts";
import { newsTransitionSamples, type TransitionSound } from "./transition-samples.ts";

/** The preview and recording use exactly the same PCM samples. */
export function newsTransitionPcm(sound: TransitionSound = "warm"): Buffer {
  const samples = newsTransitionSamples(sound);
  const pcm = Buffer.alloc(samples.length * 2);
  samples.forEach((value, index) => pcm.writeInt16LE(value, index * 2));
  return pcm;
}

/** Each news item occupies one paragraph; the standard greeting/title/closing are not news. */
export function isSpeechFrame(paragraph: string) {
  const text = paragraph.trim();
  return text === speechClosing("tr") || text === speechClosing("en")
    || /^(?:(?:dijitalmasallar\.com tarafından hazırlanan )?Günün teknoloji bültenini burada tamamlıyoruz, bizi dinlediğiniz için teşekkür ederiz\.|That concludes today[’']s technology bulletin(?:, prepared by dijitalmasallar\.com)?\. Thank you for listening\.)$/iu.test(text)
    || /^[^\n]+ tarihli (?:günlük teknoloji özetine|bültene) hoş geldiniz\.$/iu.test(text)
    || /^Welcome to the (?:daily technology roundup|bulletin) for [^\n]+\.$/iu.test(text)
    || /^(?:Günlük teknoloji bültenini dinlediniz, teşekkür ederiz\.|You have been listening to the daily technology bulletin\. Thank you for listening\.)$/iu.test(text)
    || /^(?:Dijital Masallar günlük teknoloji özetine hoş geldiniz\.|Welcome to the Dijital Masallar daily technology roundup\.)$/iu.test(text)
    || /^dijitalmasallar\.com tarafından hazırlanan [^\n]+ tarihli (?:günlük teknoloji özetine|bültene) hoş geldiniz\.$/iu.test(text)
    || /^Welcome to the (?:daily technology roundup|bulletin) for [^\n]+, prepared by dijitalmasallar\.com\.$/iu.test(text)
    || /^[^\n]+ · Günün özeti$/u.test(text)
    || /^(?:dijitalmasallar\.com['’]un hazırladığı günlük teknoloji bültenini dinlediniz|You have been listening to the daily technology bulletin prepared by dijitalmasallar\.com|Haberlerin ayrıntıları ve daha fazlası için (?:www\.)?dijitalmasallar\.com|For more details on these stories and more, visit (?:www\.)?dijitalmasallar\.com)/iu.test(text)
    || /^(?:Bugün de bu kadar\.[\s]*İyi akşamlar\.)$/iu.test(text);
}
