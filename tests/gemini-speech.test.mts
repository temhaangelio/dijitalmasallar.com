import test from "node:test";
import assert from "node:assert/strict";
import { generateGeminiSpeech, pcmToWav, speechChunks } from "../src/lib/speech/gemini.ts";

const pcm = Buffer.alloc(48000, 1);
const reply = (data = pcm.toString("base64"), mimeType = "audio/L16;codec=pcm;rate=24000") => ({
  candidates: [{ finishReason: "STOP", content: { parts: [{ inlineData: { data, mimeType } }] } }],
});

test("chunks preserve words and order across paragraphs and long sentences", () => {
  const source = "Dijital Masallar günlük teknoloji özetine hoş geldiniz.\n\n" + "Microsoft ve OpenAI hakkında yeni haberler var. ".repeat(60);
  const chunks = speechChunks(source);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length <= 700));
  assert.equal(chunks.join(" "), source.trim().replace(/\s+/g, " "));
  assert.throws(() => speechChunks("x".repeat(701)), /çok uzun/);
});

test("WAV header describes mono 24kHz 16-bit PCM without altering samples", () => {
  const wav = pcmToWav(pcm);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(4), wav.length - 8);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
  assert.throws(() => pcmToWav(Buffer.alloc(1)));
});

test("request selects Gemini TTS and voice, preserves transcript, keeps key out of URL", async () => {
  let calls = 0;
  const fake: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(String(url), "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent");
    assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-secret");
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.generationConfig.responseModalities, ["AUDIO"]);
    assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, "Charon");
    assert.match(body.contents[0].parts[0].text, /TRANSCRIPT:\nDijital Masallar/);
    return Response.json(reply());
  };
  const result = await generateGeminiSpeech("Dijital Masallar günlük teknoloji özetine hoş geldiniz.", "Charon", "tr", "test-secret", fake);
  assert.equal(calls, 1);
  assert.equal(result.durationSeconds, 1);
  assert.deepEqual(result.wav.subarray(44), pcm);
});

test("multiple chunks concatenate audio with a short silence", async () => {
  const source = "Haberleri birlikte inceleyelim. ".repeat(50);
  const count = speechChunks(source).length;
  let calls = 0;
  const result = await generateGeminiSpeech(source, "Kore", "tr", "test", async () => {
    calls++;
    return Response.json(reply());
  });
  assert.equal(calls, count);
  assert.equal(result.wav.length, 44 + count * pcm.length + (count - 1) * 12000);
  assert.deepEqual(result.wav.subarray(44 + pcm.length, 44 + pcm.length + 12000), Buffer.alloc(12000));
});

test("missing key and oversized text never call the provider", async () => {
  const fake: typeof fetch = async () => { assert.fail("Unexpected paid request"); };
  await assert.rejects(generateGeminiSpeech("test", "Charon", "tr", "", fake), /anahtarı eksik/);
  await assert.rejects(generateGeminiSpeech("x".repeat(6001), "Charon", "tr", "test", fake), /6.000/);
});

test("quota errors are not retried", async () => {
  let calls = 0;
  await assert.rejects(generateGeminiSpeech("test", "Charon", "tr", "test", async () => {
    calls++;
    return new Response(null, { status: 429 });
  }), /kota/);
  assert.equal(calls, 1);
});

test("truncated, empty, wrong-format and corrupt replies never become recordings", async () => {
  for (const response of [
    { candidates: [{ finishReason: "MAX_TOKENS" }] },
    { promptFeedback: { blockReason: "SAFETY" } },
    { candidates: [{ finishReason: "STOP", content: { parts: [] } }] },
    reply(pcm.toString("base64"), "audio/mp3"),
    reply(pcm.toString("base64"), "audio/L16;rate=48000"),
    reply("not base64!"),
    reply(Buffer.alloc(1).toString("base64")),
  ]) {
    await assert.rejects(generateGeminiSpeech("test", "Charon", "tr", "test", async () => Response.json(response)));
  }
});

test("news chimes occur only between stories, never at length-based chunk boundaries or the closing", async () => {
  const { speechPlan } = await import("../src/lib/speech/gemini.ts");
  const { newsTransitionPcm } = await import("../src/lib/speech/transition.ts");
  const intro = "Dijital Masallar günlük teknoloji özetine hoş geldiniz.";
  const first = "Birinci haberin ayrıntıları burada anlatılıyor. ".repeat(25).trim();
  const second = "İkinci haber yeni bir gelişmeyi aktarıyor.";
  const closing = "dijitalmasallar.com'un hazırladığı günlük teknoloji bültenini dinlediniz, teşekkür ederiz.";
  const source = [intro, first, second, closing].join("\n\n");
  const plan = speechPlan(source, true);
  assert.equal(plan.filter(chunk => chunk.transition).length, 1);
  assert.equal(plan.find(chunk => chunk.transition)?.text, second);
  assert.equal(plan.at(-1)?.transition, false);
  assert.equal(plan.map(chunk => chunk.text).join(" "), source.replace(/\s+/g, " "));
  const transcripts: string[] = [];
  const result = await generateGeminiSpeech(source, "Kore", "tr", "test", async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    transcripts.push(body.contents[0].parts[0].text.split("TRANSCRIPT:\n")[1]);
    return Response.json(reply());
  }, { newsTransitions: true });
  assert.deepEqual(transcripts, plan.map(chunk => chunk.text));
  const chime = newsTransitionPcm();
  let offset = 44;
  for (let index = 0; index < plan.length; index++) {
    if (index) {
      const gap = plan[index].transition ? chime : Buffer.alloc(12000);
      assert.deepEqual(result.wav.subarray(offset, offset + gap.length), gap);
      offset += gap.length;
    }
    assert.deepEqual(result.wav.subarray(offset, offset + pcm.length), pcm);
    offset += pcm.length;
  }
  assert.equal(result.wav.length, offset);
  assert.equal(result.durationSeconds, Math.ceil((offset - 44) / 48000));
});

test("disabled transitions, a single story and bilingual framing never add unwanted chimes", async () => {
  const { speechPlan } = await import("../src/lib/speech/gemini.ts");
  const en = "Welcome to the Dijital Masallar daily technology roundup.\n\nFirst story.\n\nSecond story.\n\nYou have been listening to the daily technology bulletin prepared by dijitalmasallar.com. Thank you for listening.";
  assert.equal(speechPlan(en, true).filter(chunk => chunk.transition).length, 1);
  assert.ok(speechPlan(en, false).every(chunk => !chunk.transition));
  const tr = "13 Eylül 2026 · Günün özeti\r\n\r\nBirinci haber.\r\n\r\nBugün de bu kadar. İyi akşamlar.";
  assert.ok(speechPlan(tr, true).every(chunk => !chunk.transition));
  assert.ok(speechPlan("Birinci haber. ".repeat(100), true).every(chunk => !chunk.transition));
});

test("two-note transition is short, quiet and fades to silence without clipping", async () => {
  const { newsTransitionPcm } = await import("../src/lib/speech/transition.ts");
  const chime = newsTransitionPcm();
  const samples = Array.from({ length: chime.length / 2 }, (_, i) => chime.readInt16LE(i * 2));
  assert.equal(samples.length / 24000, 0.9);
  assert.ok(samples.slice(0, 960).every(sample => sample === 0));
  assert.ok(samples.slice(-480).every(sample => sample === 0));
  const peak = Math.max(...samples.map(Math.abs));
  assert.ok(peak > 500 && peak < 4000);
  const maxStep = Math.max(...samples.slice(1).map((sample, i) => Math.abs(sample - samples[i])));
  assert.ok(maxStep < 500);
});

test("supplied intro appears once before narration with a short pause in either language", async () => {
  const { readFile } = await import("node:fs/promises");
  const intro = await readFile(new URL('../assets/audio/podcast-intro.pcm', import.meta.url));
  assert.equal(intro.length / 48000, 5.250625);
  for (const language of ['tr', 'en'] as const) {
    const result = await generateGeminiSpeech('First story.\n\nSecond story.', 'Kore', language, 'test', async () => Response.json(reply()), { introPcm: intro, newsTransitions: true });
    assert.deepEqual(result.wav.subarray(44, 44 + intro.length), intro);
    assert.deepEqual(result.wav.subarray(44 + intro.length, 44 + intro.length + 12000), Buffer.alloc(12000));
    assert.equal(result.durationSeconds, Math.ceil((result.wav.length - 44) / 48000));
  }
});
