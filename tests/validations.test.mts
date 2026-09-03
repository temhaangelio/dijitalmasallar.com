import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { postSchema } from "../src/lib/validations/post.ts";

const hour = 60 * 60 * 1000;
const future = () => new Date(Date.now() + 24 * hour).toISOString();
const past = () => new Date(Date.now() - hour).toISOString();

function basePost(overrides: Record<string, unknown> = {}) {
  return {
    tr: { body: "x".repeat(60) },
    en: { body: "y".repeat(60) },
    sourceUrl: "https://example.com/haber",
    featured: false,
    status: "published",
    ...overrides,
  };
}

describe("post validation", () => {
  test("accepts a complete published post", () => {
    assert.equal(postSchema.safeParse(basePost()).success, true);
  });

  test("rejects a non-URL source", () => {
    assert.equal(postSchema.safeParse(basePost({ sourceUrl: "example.com" })).success, false);
  });

  test("rejects a body shorter than 50 characters", () => {
    assert.equal(postSchema.safeParse(basePost({ en: { body: "kısa" } })).success, false);
  });

  test("a scheduled post needs a future date", () => {
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled", scheduledAt: future() })).success, true);
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled", scheduledAt: past() })).success, false);
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled" })).success, false);
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled", scheduledAt: "not-a-date" })).success, false);
  });

  test("an edited published post cannot use a future publication date", () => {
    assert.equal(postSchema.safeParse(basePost({ publishedAt: past() })).success, true);
    assert.equal(postSchema.safeParse(basePost({ publishedAt: future() })).success, false);
    assert.equal(postSchema.safeParse(basePost({ publishedAt: "not-a-date" })).success, false);
  });

});
