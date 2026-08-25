import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeSearchQuery, searchQueryLimit } from "../src/lib/visitor-search.ts";

describe("normalizeSearchQuery", () => {
  test("trims surrounding whitespace", () => {
    assert.equal(normalizeSearchQuery("  yapay zekâ  "), "yapay zekâ");
  });

  test("missing and empty queries collapse to an empty string", () => {
    assert.equal(normalizeSearchQuery(undefined), "");
    assert.equal(normalizeSearchQuery("   "), "");
  });

  test("a repeated parameter uses the first value", () => {
    assert.equal(normalizeSearchQuery(["ilk", "ikinci"]), "ilk");
    assert.equal(normalizeSearchQuery([]), "");
  });

  test("an over-long query is cut to the limit", () => {
    assert.equal(normalizeSearchQuery("a".repeat(500)).length, searchQueryLimit);
  });
});
