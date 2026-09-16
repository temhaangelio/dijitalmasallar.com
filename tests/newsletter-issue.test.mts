import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, issueDateLabel, issueSubject, renderIssue } from "../src/lib/newsletter/issue.ts";

const paragraphs = [
  "Şirket, yeni modelini duyurdu ve fiyatlandırmayı sadeleştirdi.",
  "Aynı gün, bir araştırma ekibi ölçüm sonuçlarını yayımladı.",
];

const base = {
  day: "2026-09-15",
  siteName: "Dijital Masallar",
  paragraphs,
  siteUrl: "https://dijitalmasallar.com",
  unsubscribeUrl: "https://dijitalmasallar.com/ebulten/cikis?t=abc",
};

test("the subject carries the Istanbul day the notes belong to, in the reader's language", () => {
  assert.equal(issueDateLabel("2026-09-15", "tr"), "15 Eylül 2026 Salı");
  assert.equal(issueSubject("2026-09-15", "tr"), "Günün notları · 15 Eylül 2026 Salı");
  assert.equal(issueSubject("2026-09-15", "en"), "Notes from the day · Tuesday, September 15, 2026");
  assert.throws(() => issueSubject("15.09.2026", "tr"));
});

test("the day is told as paragraphs, with no times, numbering or headlines", () => {
  const { html, text } = renderIssue({ ...base, language: "tr" });
  for (const paragraph of paragraphs) {
    assert.ok(html.includes(paragraph), "every note has its paragraph");
    assert.ok(text.includes(paragraph));
  }
  assert.equal(html.match(/<p style="margin:/g)?.length, 3, "one lede, one following paragraph, one greeting");
  assert.ok(!/\d{2}:\d{2}/.test(text), "no timestamps in the message");
  assert.ok(!html.includes("<ol"), "the day is prose, not a list");
});

test("a note cannot break out of the markup it is rendered into", () => {
  assert.equal(escapeHtml('<b>"x" & \'y\'</b>'), "&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;");
  const { html } = renderIssue({ ...base, language: "tr", paragraphs: ['<script>alert("x")</script>'] });
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("every message links back to the site and out of the list", () => {
  const { html, text, subject } = renderIssue({ ...base, language: "tr" });
  assert.ok(html.includes(base.unsubscribeUrl));
  assert.ok(text.includes(base.unsubscribeUrl));
  assert.ok(html.includes(`<title>${subject}</title>`));
  // The hidden preheader is what an inbox shows next to the subject.
  assert.ok(html.includes("Şirket, yeni modelini duyurdu"));
});

test("the English issue is written in English throughout", () => {
  const { html, text } = renderIssue({ ...base, language: "en" });
  assert.ok(html.includes("All notes"));
  assert.ok(html.includes("Unsubscribe"));
  assert.ok(text.includes("You are receiving this because you signed up"));
  assert.ok(!text.includes("Listeden çık"));
});
