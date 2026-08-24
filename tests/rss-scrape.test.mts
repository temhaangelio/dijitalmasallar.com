import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scrapePage } from "../src/lib/rss/scrape.ts";

/** A news index in the shape most sites use: a nav, a repeated card list, a footer. */
const page = `<html><head><title>Haberler — Örnek</title></head><body>
  <nav>
    <a href="/">Ana sayfa</a>
    <a href="/pricing">Fiyatlandırma</a>
    <a href="/about">Hakkımızda</a>
  </nav>
  <main>
    <a href="/news/ilk-haber"><div>Duyurular</div><div>21 Temmuz 2026</div><div>Şirket yeni bir ürün duyurdu</div><p>Bu bir özet cümlesidir ve başlıktan uzundur.</p></a>
    <a href="/news/ikinci-haber"><h3>İkinci haberin başlığı burada</h3><p>Kısa bir özet.</p></a>
    <a href="/news/ucuncu-haber"><div>Jul 9, 2026</div><div>Üçüncü haberin başlığı</div></a>
    <a href="/news/dorduncu-haber" aria-label="Dördüncü haberin başlığı"><span>Devamı</span></a>
  </main>
  <footer>
    <a href="/legal/privacy">Gizlilik politikası metni</a>
    <a href="/legal/terms">Kullanım koşulları metni</a>
    <a href="/legal/cookies">Çerez politikası metni</a>
  </footer>
</body></html>`;

describe("scrapePage", () => {
  it("picks the repeated article group and ignores nav and footer", () => {
    const feed = scrapePage(page, "https://ornek.com/news");
    assert.equal(feed.title, "Haberler — Örnek");
    assert.deepEqual(feed.items.map((item) => item.link), [
      "https://ornek.com/news/ilk-haber",
      "https://ornek.com/news/ikinci-haber",
      "https://ornek.com/news/ucuncu-haber",
      "https://ornek.com/news/dorduncu-haber",
    ]);
  });

  it("skips the category and date lines to reach the headline", () => {
    const [first, , third] = scrapePage(page, "https://ornek.com/news").items;
    // "Duyurular" is too short to be a headline and "21 Temmuz 2026" is a date, so both are passed
    // over; the excerpt that follows is longer but comes later.
    assert.equal(first.title, "Şirket yeni bir ürün duyurdu");
    assert.equal(third.title, "Üçüncü haberin başlığı");
  });

  it("prefers a heading element when the card has one", () => {
    const [, second] = scrapePage(page, "https://ornek.com/news").items;
    assert.equal(second.title, "İkinci haberin başlığı burada");
  });

  it("falls back to aria-label when the link has no usable text", () => {
    const [, , , fourth] = scrapePage(page, "https://ornek.com/news").items;
    assert.equal(fourth.title, "Dördüncü haberin başlığı");
  });

  it("uses the link as the identity and leaves the date unset", () => {
    const [first] = scrapePage(page, "https://ornek.com/news").items;
    assert.equal(first.guid, first.link);
    assert.equal(first.publishedAt, null);
  });

  it("returns nothing rather than guessing when no group repeats", () => {
    const thin = `<html><head><title>Boş</title></head><body>
      <a href="/pricing">Fiyatlandırma sayfası</a>
      <a href="https://baska-site.com/news/x">Başka sitedeki bir haber</a>
    </body></html>`;
    assert.deepEqual(scrapePage(thin, "https://ornek.com/news").items, []);
    assert.deepEqual(scrapePage("", "https://ornek.com/news").items, []);
    assert.deepEqual(scrapePage(page, "not a url"), { title: "", siteUrl: "", items: [] });
  });

  it("keeps off-site links out", () => {
    const mixed = `<html><body>
      <a href="/news/bir">Sitedeki ilk haber başlığı</a>
      <a href="/news/iki">Sitedeki ikinci haber başlığı</a>
      <a href="/news/uc">Sitedeki üçüncü haber başlığı</a>
      <a href="https://twitter.com/news/paylasim">Twitter üzerindeki bir paylaşım</a>
    </body></html>`;
    const links = scrapePage(mixed, "https://ornek.com/news").items.map((item) => item.link);
    assert.equal(links.length, 3);
    assert.ok(links.every((link) => link.startsWith("https://ornek.com/")));
  });
});
