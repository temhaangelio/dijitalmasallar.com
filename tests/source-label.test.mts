import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sourceLabel } from "../src/lib/source-label.ts";

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
