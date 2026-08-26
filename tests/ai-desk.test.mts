import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normaliseUrl } from "../src/lib/ai/url.ts";
import { isSitemapIndex, parseSitemap, parseSitemapIndex } from "../src/lib/ai/sitemap.ts";

describe("normaliseUrl", () => {
  it("treats the same story under different addresses as one", () => {
    const canonical = normaliseUrl("https://ornek.com/haber/yeni-model");
    assert.equal(normaliseUrl("https://www.ornek.com/haber/yeni-model/"), canonical);
    assert.equal(normaliseUrl("http://ornek.com/haber/yeni-model#giris"), canonical);
    assert.equal(normaliseUrl("https://ornek.com/haber/yeni-model?utm_source=twitter&ref=feed"), canonical);
  });

  it("keeps parameters the page actually depends on", () => {
    assert.equal(normaliseUrl("https://ornek.com/haber?id=42&utm_medium=rss"), "https://ornek.com/haber?id=42");
  });

  it("orders the query so a reshuffled link is still the same story", () => {
    assert.equal(normaliseUrl("https://ornek.com/x?b=2&a=1"), normaliseUrl("https://ornek.com/x?a=1&b=2"));
  });

  it("keeps distinct stories distinct", () => {
    assert.notEqual(normaliseUrl("https://ornek.com/haber/bir"), normaliseUrl("https://ornek.com/haber/iki"));
  });

  it("returns something usable for an address that will not parse", () => {
    assert.equal(normaliseUrl("  bozuk adres "), "bozuk adres");
  });
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ornek.com/haber/eski</loc><lastmod>2026-01-04</lastmod></url>
  <url><loc>https://ornek.com/haber/yeni</loc><lastmod>2026-08-20T10:00:00Z</lastmod></url>
  <url><loc>https://ornek.com/hakkinda</loc></url>
</urlset>`;

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://ornek.com/sitemap-2025.xml</loc><lastmod>2025-12-31</lastmod></sitemap>
  <sitemap><loc>https://ornek.com/sitemap-2026.xml</loc><lastmod>2026-08-20</lastmod></sitemap>
</sitemapindex>`;

describe("sitemap", () => {
  it("tells an index apart from a plain sitemap", () => {
    assert.equal(isSitemapIndex(index), true);
    assert.equal(isSitemapIndex(sitemap), false);
  });

  it("returns entries newest first", () => {
    const entries = parseSitemap(sitemap);
    assert.equal(entries[0].url, "https://ornek.com/haber/yeni");
    assert.equal(entries.length, 3);
  });

  it("puts the most recent child sitemap first, because only it can hold today's news", () => {
    assert.equal(parseSitemapIndex(index)[0].url, "https://ornek.com/sitemap-2026.xml");
  });

  it("prefers a news publication date over lastmod", () => {
    const news = `<urlset><url><loc>https://ornek.com/a</loc><lastmod>2026-08-01</lastmod>
      <news:news><news:publication_date>2026-08-25T08:00:00Z</news:publication_date></news:news></url></urlset>`;
    assert.equal(parseSitemap(news)[0].lastModified, "2026-08-25T08:00:00Z");
  });
});
