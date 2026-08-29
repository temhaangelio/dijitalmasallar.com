import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractSourceImage } from "../src/lib/source-image-parser.ts";

describe("extractSourceImage", () => {
  test("prefers the Open Graph image and resolves relative URLs", () => {
    const html = '<meta name="twitter:image" content="https://cdn.example.com/twitter.jpg"><meta content="/images/story.jpg" property="og:image">';
    assert.equal(extractSourceImage(html, "https://example.com/news/post"), "https://example.com/images/story.jpg");
  });

  test("accepts Twitter image metadata when Open Graph is absent", () => {
    assert.equal(extractSourceImage('<meta content="https://cdn.example.com/card.png" name="twitter:image">', "https://example.com"), "https://cdn.example.com/card.png");
  });

  test("returns null without usable image metadata", () => {
    assert.equal(extractSourceImage("<title>News</title>", "https://example.com"), null);
  });
});
