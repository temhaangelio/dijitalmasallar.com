import test from "node:test";
import assert from "node:assert/strict";
import { speechOpening, speechClosing, initialSpeechScript } from "../src/lib/speech/script-text.ts";
import { speechPlan } from "../src/lib/speech/gemini.ts";

test("opening uses the selected bulletin date and weekday in both languages", () => {
  assert.equal(speechOpening("2026-09-13", "tr"), "dijitalmasallar.com tarafından hazırlanan 13 Eylül 2026 Pazar tarihli bültene hoş geldiniz.");
  assert.match(speechOpening("2026-09-12", "tr"), /12 Eylül 2026 Cumartesi/);
  assert.match(speechOpening("2026-09-13", "en"), /Sunday, September 13, 2026/);
  for (const day of ["2026-02-30", "2026-13-01", "bad"]) assert.throws(() => speechOpening(day, "tr"), /Geçersiz gün/);
});

test("initial script replaces the date heading and keeps news text intact", () => {
  const body = "Birinci haber.\n\nİkinci haber.";
  assert.equal(initialSpeechScript(`13 Eylül 2026 · Günün özeti\n\n${body}`, "2026-09-13", "tr"), `${speechOpening("2026-09-13", "tr")}\n\n${body}\n\n${speechClosing("tr")}`);
});

test("dated opening never triggers a chime before the first news story", () => {
  for (const language of ["tr", "en"] as const) {
    const plan = speechPlan(`${speechOpening("2026-09-13", language)}\n\nFirst story.\n\nSecond story.`, true);
    assert.deepEqual(plan.map(chunk => chunk.transition), [false, false, true]);
  }
});

 test("automatic scripts keep every story and the closing outside news transitions", () => {
  for (const language of ["tr", "en"] as const) {
    const script = initialSpeechScript("First story.\n\nSecond story.", "2026-09-13", language);
    assert.ok(script.endsWith(speechClosing(language)));
    assert.deepEqual(speechPlan(script, true).map(chunk => chunk.transition), [false, false, true, false]);
  }
});
