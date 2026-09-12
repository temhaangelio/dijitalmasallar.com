import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getFeedPagination } from "../src/lib/feed-pagination.ts";

test("initial and subsequent feed batches fill two-column rows", () => {
  const initial = getFeedPagination(7);
  assert.equal(initial.visibleCount, 8);
  assert.equal(initial.fetchCount, 9);
  assert.equal(initial.nextCount, 16);
  assert.equal(getFeedPagination(7, String(initial.nextCount)).nextCount, 24);
});
test("shared links and malformed limits normalize to complete rows", () => {
  assert.equal(getFeedPagination(7, "14").visibleCount, 14);
  assert.equal(getFeedPagination(7, "9").visibleCount, 10);
  assert.equal(getFeedPagination(7, "bad").visibleCount, 8);
  assert.equal(getFeedPagination(7, "-1").visibleCount, 8);
  assert.equal(getFeedPagination(12).visibleCount, 12);
});
test("query cap leaves a look-ahead record and stops loading", () => {
  const last = getFeedPagination(7, "500");
  assert.equal(last.visibleCount, 498);
  assert.equal(last.fetchCount, 499);
  assert.equal(last.canLoadMore, false);
  assert.equal(getFeedPagination(7, "495").nextCount, 498);
});

describe("getFeedPagination with a deck", () => {
  test("the first page carries the deck as well as a page of the list", () => {
    const page = getFeedPagination(7, undefined, 10);
    assert.equal(page.pageSize, 8);
    assert.equal(page.visibleCount, 18);
    assert.equal(page.fetchCount, 19);
  });

  test("a deck of zero leaves the paging exactly as it was", () => {
    assert.deepEqual(getFeedPagination(7, undefined, 0), getFeedPagination(7));
  });

  test("a limit already past the first page still wins", () => {
    assert.equal(getFeedPagination(7, "40", 10).visibleCount, 40);
  });
});
