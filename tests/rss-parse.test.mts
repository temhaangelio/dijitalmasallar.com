import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discoverFeedUrls, parseFeed } from "../src/lib/rss/parse.ts";

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Örnek Teknoloji</title>
    <link>https://ornek.com</link>
    <description>Kanal açıklaması</description>
    <item>
      <title><![CDATA[Yeni bir <b>sürüm</b> yayınlandı]]></title>
      <link>https://ornek.com/haber/1</link>
      <guid isPermaLink="false">ornek-1</guid>
      <pubDate>Mon, 24 Aug 2026 09:30:00 +0300</pubDate>
      <dc:creator>Ayşe Yılmaz</dc:creator>
      <description>&lt;p&gt;Güncelleme &amp;amp; notlar&lt;/p&gt;</description>
    </item>
    <item>
      <title>İkinci haber</title>
      <link>/haber/2</link>
      <content:encoded><![CDATA[<p>Uzun gövde metni</p>]]></content:encoded>
    </item>
  </channel>
</rss>`;

const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Kaynağı</title>
  <link rel="self" href="https://atom.example/feed.xml"/>
  <link rel="alternate" href="https://atom.example/"/>
  <entry>
    <title>Atom girdisi</title>
    <link rel="alternate" href="https://atom.example/post/1"/>
    <id>tag:atom.example,2026:1</id>
    <published>2026-08-24T06:00:00Z</published>
    <author><name>Mehmet Demir</name></author>
    <summary type="html">&lt;em&gt;Özet&lt;/em&gt; metni</summary>
  </entry>
</feed>`;

describe("parseFeed", () => {
  it("reads channel metadata without borrowing an item's title", () => {
    const feed = parseFeed(rss, "https://ornek.com/rss.xml");
    assert.equal(feed.title, "Örnek Teknoloji");
    assert.equal(feed.siteUrl, "https://ornek.com/");
    assert.equal(feed.items.length, 2);
  });

  it("unwraps CDATA and strips escaped markup down to plain text", () => {
    const [first] = parseFeed(rss, "https://ornek.com/rss.xml").items;
    assert.equal(first.title, "Yeni bir sürüm yayınlandı");
    // The description is escaped HTML: the tags are dropped and `&amp;amp;` resolves to the literal.
    assert.equal(first.summary, "Güncelleme & notlar");
  });

  it("keeps an opaque guid and reads a prefixed author", () => {
    const [first] = parseFeed(rss, "https://ornek.com/rss.xml").items;
    assert.equal(first.guid, "ornek-1");
    assert.equal(first.author, "Ayşe Yılmaz");
    assert.equal(first.publishedAt, "2026-08-24T06:30:00.000Z");
  });

  it("resolves a relative item link against the feed URL", () => {
    const [, second] = parseFeed(rss, "https://ornek.com/rss.xml").items;
    assert.equal(second.link, "https://ornek.com/haber/2");
    assert.equal(second.summary, "Uzun gövde metni");
    // With no guid or id element, the resolved link stands in as the identity.
    assert.equal(second.guid, "https://ornek.com/haber/2");
  });

  it("prefers the alternate relation over self for an Atom entry", () => {
    const feed = parseFeed(atom, "https://atom.example/feed.xml");
    assert.equal(feed.title, "Atom Kaynağı");
    assert.equal(feed.siteUrl, "https://atom.example/");
    const [entry] = feed.items;
    assert.equal(entry.link, "https://atom.example/post/1");
    assert.equal(entry.guid, "tag:atom.example,2026:1");
    assert.equal(entry.author, "Mehmet Demir");
    assert.equal(entry.summary, "Özet metni");
  });

  it("returns an empty feed instead of throwing on unusable input", () => {
    assert.deepEqual(parseFeed("<html><body>not a feed</body></html>", "https://ornek.com"), { title: "", siteUrl: "", items: [] });
    assert.equal(parseFeed("", "https://ornek.com").items.length, 0);
    assert.equal(parseFeed("<rss><channel><item><title>", "https://ornek.com").items.length, 0);
  });

  it("drops duplicate guids within one fetch", () => {
    const repeated = `<rss><channel><title>T</title>
      <item><title>A</title><guid>same</guid></item>
      <item><title>B</title><guid>same</guid></item>
    </channel></rss>`;
    assert.equal(parseFeed(repeated, "https://ornek.com").items.length, 1);
  });
});

describe("discoverFeedUrls", () => {
  const page = `<html><head>
    <link rel="stylesheet" href="/site.css">
    <link rel="alternate" type="application/rss+xml" title="Örnek Blog &raquo; Yorum akışı" href="/comments/feed/">
    <link rel="alternate" type="application/rss+xml" title="Örnek Blog" href="/feed/">
    <link rel="alternate" type="application/atom+xml" href="https://cdn.ornek.com/atom.xml">
    <link rel="alternate" type="text/html" hreflang="en" href="/en/">
  </head><body></body></html>`;

  it("finds only the feed announcements and resolves them", () => {
    assert.deepEqual(discoverFeedUrls(page, "https://ornek.com/blog"), [
      "https://ornek.com/feed/",
      "https://cdn.ornek.com/atom.xml",
      "https://ornek.com/comments/feed/",
    ]);
  });

  it("puts a comments feed last, since it is almost never the one meant", () => {
    const [first] = discoverFeedUrls(page, "https://ornek.com/blog");
    assert.equal(first, "https://ornek.com/feed/");
  });

  it("returns nothing for a page that announces no feed", () => {
    assert.deepEqual(discoverFeedUrls("<html><head><title>Yok</title></head></html>", "https://ornek.com"), []);
  });
});
