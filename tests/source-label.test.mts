import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sourceBadgeInitials, sourceLabel } from "../src/lib/source-label.ts";

describe("sourceLabel", () => {
  it("uses an explicit source name first", () => {
    assert.equal(sourceLabel("Teknoloji Haberleri", "https://www.example.com/news.html", "Kaynak"), "Teknoloji Haberleri");
  });

  it("reduces a source URL to its domain", () => {
    assert.equal(sourceLabel(null, "https://www.example.com/haber/detay.html?ref=home", "Kaynak"), "example.com");
  });

  it("falls back when no usable source is available", () => {
    assert.equal(sourceLabel("", "not a url", "Kaynak"), "Kaynak");
  });
});

describe("sourceBadgeInitials", () => {
  it("uses the main domain instead of a subdomain", () => {
    assert.equal(sourceBadgeInitials("https://teknoloji.example.com/haber", "Teknoloji", "tr"), "EX");
  });

  it("handles country-code domain suffixes", () => {
    assert.equal(sourceBadgeInitials("https://news.example.com.tr/haber", "Haber", "tr"), "EX");
    assert.equal(sourceBadgeInitials("https://news.bbc.co.uk/story", "BBC News", "en"), "BB");
  });

  it("uses Google's brand TLD instead of its property name", () => {
    assert.equal(
      sourceBadgeInitials("https://blog.google/company-news/outreach-and-initiatives/arts-culture/united-parks-of-america/", "Google", "en"),
      "GO",
    );
  });

  it("falls back to the source label without a usable URL", () => {
    assert.equal(sourceBadgeInitials(null, "İçerik", "tr"), "İÇ");
  });
});
