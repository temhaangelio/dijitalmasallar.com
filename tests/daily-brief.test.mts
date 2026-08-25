import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { briefSentence, dailyBriefMax, dailyBriefPosts, dailyBriefText } from "../src/lib/daily-brief.ts";
import type { Post } from "../src/types/database.ts";

/** Times are UTC; the brief groups by the Istanbul day, which is three hours ahead. */
function note(id: string, createdAt: string, body: string, excerpt = ""): Post {
  return {
    id, author_id: "", title: "", slug: id, excerpt, body, category: "",
    status: "published", language: "tr", cover_path: null, source_name: null, source_url: null,
    published_at: createdAt, scheduled_at: null, reads: 0, created_at: createdAt, updated_at: createdAt,
  };
}

describe("dailyBriefPosts", () => {
  test("keeps only the notes of the newest Istanbul day", () => {
    const posts = [
      note("1", "2026-08-25T11:00:00Z", "Bugünkü not."),
      note("2", "2026-08-25T06:00:00Z", "Bugünkü ikinci not."),
      note("3", "2026-08-24T18:00:00Z", "Dünkü not."),
    ];
    assert.deepEqual(dailyBriefPosts(posts).map((post) => post.id), ["1", "2"]);
  });

  test("a note published after Istanbul midnight belongs to the new day", () => {
    // 22:30 UTC is 01:30 the next day in Istanbul, so these two are not the same day.
    const posts = [note("1", "2026-08-24T22:30:00Z", "Gece notu."), note("2", "2026-08-24T12:00:00Z", "Gündüz notu.")];
    assert.deepEqual(dailyBriefPosts(posts).map((post) => post.id), ["1"]);
  });

  test("covers the whole day, up to the runaway cap", () => {
    const posts = Array.from({ length: 12 }, (_, index) => note(String(index), "2026-08-25T09:00:00Z", "Not."));
    assert.equal(dailyBriefPosts(posts).length, 12);
    const flood = Array.from({ length: dailyBriefMax + 15 }, (_, index) => note(String(index), "2026-08-25T09:00:00Z", "Not."));
    assert.equal(dailyBriefPosts(flood).length, dailyBriefMax);
  });

  test("no posts, no brief", () => {
    assert.deepEqual(dailyBriefPosts([]), []);
  });
});

describe("briefSentence", () => {
  test("closes a sentence that lost its full stop", () => {
    assert.equal(briefSentence(note("1", "2026-08-25T09:00:00Z", "", "Noktasız özet")), "Noktasız özet.");
  });

  test("leaves existing punctuation alone", () => {
    assert.equal(briefSentence(note("1", "2026-08-25T09:00:00Z", "", "Sorulu özet?")), "Sorulu özet?");
  });
});

describe("dailyBriefText", () => {
  const posts = [
    note("1", "2026-08-25T11:00:00Z", "", "İlk haber"),
    note("2", "2026-08-25T09:00:00Z", "", "İkinci haber."),
    note("3", "2026-08-25T08:00:00Z", "", "Üçüncü haber."),
  ];

  test("links the notes into one telling of the day", () => {
    assert.equal(dailyBriefText(posts, "tr"), "İlk haber. Ayrıca İkinci haber. Öte yandan Üçüncü haber.");
  });

  test("uses the connectors of the language being read", () => {
    assert.equal(dailyBriefText(posts, "en"), "İlk haber. Meanwhile, İkinci haber. Elsewhere, Üçüncü haber.");
  });

  test("a single note gets no connector", () => {
    assert.equal(dailyBriefText(posts.slice(0, 1), "tr"), "İlk haber.");
  });

  test("connectors cycle rather than repeating one word all day", () => {
    const many = Array.from({ length: 8 }, (_, index) => note(String(index), "2026-08-25T09:00:00Z", "", `Haber ${index}`));
    const text = dailyBriefText(many, "tr");
    assert.ok(text.startsWith("Haber 0. Ayrıca Haber 1. Öte yandan Haber 2."), text.slice(0, 80));
    // Six connectors, so the seventh sentence is where the first one comes round again.
    assert.ok(text.includes("Ayrıca Haber 7."), text.slice(-60));
  });

  test("empty notes leave no paragraph", () => {
    assert.equal(dailyBriefText([], "tr"), "");
  });
});
