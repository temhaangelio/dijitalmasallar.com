import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parsePostContent, stripMarkdown } from "../src/lib/post-content.ts";

describe("stripMarkdown", () => {
  test("drops images and unwraps links", () => {
    assert.equal(stripMarkdown("![kapak](https://x/y.png) metin"), "metin");
    assert.equal(stripMarkdown("[Kaynak](https://example.com) açıldı"), "Kaynak açıldı");
  });

  test("removes emphasis, code and highlight markers", () => {
    assert.equal(stripMarkdown("**kalın** _italik_ `kod` ==vurgu=="), "kalın italik kod vurgu");
  });

  test("removes headings and collapses whitespace", () => {
    assert.equal(stripMarkdown("## Başlık\n\n   iki   boşluk  "), "Başlık iki boşluk");
  });
});

describe("parsePostContent", () => {
  test("splits an authored post into title, excerpt and body", () => {
    const parsed = parsePostContent("# Başlık\n\nKısa özet.\n\nGövde birinci paragraf.\n\nGövde ikinci paragraf.");
    assert.equal(parsed.title, "Başlık");
    assert.equal(parsed.excerpt, "Kısa özet.");
    assert.equal(parsed.body, "Gövde birinci paragraf.\n\nGövde ikinci paragraf.");
  });

  test("keeps the whole value as body when there is no title block", () => {
    const value = "Bir cümle. İkinci cümle burada.";
    const parsed = parsePostContent(value);
    assert.equal(parsed.title, "Bir cümle.");
    assert.equal(parsed.body, value);
    assert.equal(parsed.excerpt, "Bir cümle. İkinci cümle burada.");
  });

  test("a heading with no body is not treated as a title block", () => {
    // Posts saved with the title toggle off can still start with '#', so the body must survive.
    const parsed = parsePostContent("# Yalnızca başlık");
    assert.equal(parsed.body, "# Yalnızca başlık");
    assert.equal(parsed.title, "Yalnızca başlık");
  });

  test("truncates an over-long derived title with an ellipsis", () => {
    const parsed = parsePostContent("x".repeat(400));
    assert.ok(parsed.title.length <= 110, `title was ${parsed.title.length} characters`);
    assert.ok(parsed.title.endsWith("…"));
  });

  test("truncates an over-long derived excerpt with an ellipsis", () => {
    const parsed = parsePostContent(`${"kelime ".repeat(80)}son.`);
    assert.ok(parsed.excerpt.length <= 180, `excerpt was ${parsed.excerpt.length} characters`);
    assert.ok(parsed.excerpt.endsWith("…"));
  });

  test("short content is left untouched", () => {
    const parsed = parsePostContent("Kısa.");
    assert.equal(parsed.title, "Kısa.");
    assert.equal(parsed.excerpt, "Kısa.");
    assert.ok(!parsed.excerpt.endsWith("…"));
  });
});
