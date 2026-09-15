import { test } from "node:test";
import assert from "node:assert/strict";
import { postSchema } from "../src/lib/validations/post.ts";

const draft = { tr: { body: "Yarım kalan bir haber." }, en: { body: "" }, sourceUrl: "", status: "draft" };
test("a draft can have a short text, no translation and no source", () => {
  assert.equal(postSchema.safeParse(draft).success, true);
  assert.equal(postSchema.safeParse({ ...draft, tr: { body: "" }, en: { body: "English draft" } }).success, true);
});
test("empty drafts and invalid source URLs are rejected", () => {
  assert.equal(postSchema.safeParse({ ...draft, tr: { body: "  " } }).success, false);
  assert.equal(postSchema.safeParse({ ...draft, sourceUrl: "javascript:alert(1)" }).success, false);
});
test("publishing or scheduling an unfinished draft requires both texts and a source", () => {
  for (const status of ["published", "scheduled"]) assert.equal(postSchema.safeParse({ ...draft, status }).success, false);
  const ready = { ...draft, tr: { body: "Türkçe haber içeriği. ".repeat(4) }, en: { body: "English news content. ".repeat(4) }, sourceUrl: "https://example.com/news", status: "published" };
  assert.equal(postSchema.safeParse(ready).success, true);
  assert.equal(postSchema.safeParse({ ...ready, status: "scheduled", scheduledAt: "2000-01-01" }).success, false);
  assert.equal(postSchema.safeParse({ ...ready, status: "scheduled", scheduledAt: "2099-01-01" }).success, true);
});
