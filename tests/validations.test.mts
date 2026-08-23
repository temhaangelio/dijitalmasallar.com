import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { emailSchema, loginSchema, passwordSchema, resetPasswordSchema } from "../src/lib/validations/auth.ts";
import { postSchema } from "../src/lib/validations/post.ts";
import { newsletterSchema } from "../src/lib/validations/newsletter.ts";
import { settingsSchema } from "../src/lib/validations/settings.ts";

const hour = 60 * 60 * 1000;
const future = () => new Date(Date.now() + 24 * hour).toISOString();
const past = () => new Date(Date.now() - hour).toISOString();

function basePost(overrides: Record<string, unknown> = {}) {
  return {
    tr: { title: "Türkçe başlık", excerpt: "Türkçe özet en az yirmi karakter.", body: "x".repeat(60) },
    en: { title: "English title", excerpt: "An English summary of at least twenty characters.", body: "y".repeat(60) },
    category: "Teknoloji",
    sourceName: "OpenAI",
    sourceUrl: "https://example.com/haber",
    showTitle: true,
    showExcerpt: true,
    status: "published",
    ...overrides,
  };
}

describe("auth validation", () => {
  test("normalises and validates e-mail", () => {
    assert.equal(emailSchema.safeParse("  okur@diji.news  ").data, "okur@diji.news");
    assert.equal(emailSchema.safeParse("okur@").success, false);
    assert.equal(emailSchema.safeParse("").success, false);
  });

  test("passwords need length, a letter and a digit", () => {
    assert.equal(passwordSchema.safeParse("kisa1").success, false);
    assert.equal(passwordSchema.safeParse("yalnizcaharf").success, false);
    assert.equal(passwordSchema.safeParse("12345678").success, false);
    assert.equal(passwordSchema.safeParse("guclusifre1").success, true);
  });

  test("login needs a non-empty password but does not enforce the policy", () => {
    assert.equal(loginSchema.safeParse({ email: "admin@diji.news", password: "x" }).success, true);
    assert.equal(loginSchema.safeParse({ email: "admin@diji.news", password: "" }).success, false);
  });

  test("reset requires the two passwords to match", () => {
    assert.equal(resetPasswordSchema.safeParse({ password: "guclusifre1", confirmPassword: "guclusifre1" }).success, true);
    const mismatch = resetPasswordSchema.safeParse({ password: "guclusifre1", confirmPassword: "baskasifre1" });
    assert.equal(mismatch.success, false);
    assert.deepEqual(mismatch.error?.issues[0]?.path, ["confirmPassword"]);
  });
});

describe("post validation", () => {
  test("accepts a complete published post", () => {
    assert.equal(postSchema.safeParse(basePost()).success, true);
  });

  test("rejects a non-URL source", () => {
    assert.equal(postSchema.safeParse(basePost({ sourceUrl: "example.com" })).success, false);
  });

  test("rejects a body shorter than 50 characters", () => {
    assert.equal(postSchema.safeParse(basePost({ en: { title: "T", excerpt: "An English summary of at least twenty characters.", body: "kısa" } })).success, false);
  });

  test("a scheduled post needs a future date", () => {
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled", scheduledAt: future() })).success, true);
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled", scheduledAt: past() })).success, false);
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled" })).success, false);
    assert.equal(postSchema.safeParse(basePost({ status: "scheduled", scheduledAt: "not-a-date" })).success, false);
  });

  test("an edited published post cannot use a future publication date", () => {
    assert.equal(postSchema.safeParse(basePost({ publishedAt: past() })).success, true);
    assert.equal(postSchema.safeParse(basePost({ publishedAt: future() })).success, false);
    assert.equal(postSchema.safeParse(basePost({ publishedAt: "not-a-date" })).success, false);
  });

  test("title and excerpt minimums only apply while they are shown", () => {
    const hidden = basePost({ showTitle: false, showExcerpt: false, en: { title: "", excerpt: "", body: "y".repeat(60) } });
    assert.equal(postSchema.safeParse(hidden).success, true);

    const shownButEmpty = basePost({ en: { title: "ab", excerpt: "kısa", body: "y".repeat(60) } });
    assert.equal(postSchema.safeParse(shownButEmpty).success, false);
  });
});

describe("newsletter validation", () => {
  const base = { subject: "Haftanın notları", previewText: "Kısa açıklama", content: "x".repeat(40), status: "draft" };

  test("accepts a draft", () => {
    assert.equal(newsletterSchema.safeParse(base).success, true);
  });

  test("rejects a short subject or short content", () => {
    assert.equal(newsletterSchema.safeParse({ ...base, subject: "ab" }).success, false);
    assert.equal(newsletterSchema.safeParse({ ...base, content: "kısa" }).success, false);
  });

  test("a scheduled issue needs a future date", () => {
    assert.equal(newsletterSchema.safeParse({ ...base, status: "scheduled", scheduledAt: future() }).success, true);
    assert.equal(newsletterSchema.safeParse({ ...base, status: "scheduled", scheduledAt: past() }).success, false);
  });
});

describe("settings validation", () => {
  const base = {
    siteName: "diji.news", domain: "diji.news",
    description: "Türkçe açıklama metni.", descriptionEn: "English description text.",
    aboutText: "Hakkında metni en az yirmi karakter uzunluğunda olmalı.", aboutTextEn: "The about text has to be at least twenty characters long.",
    language: "tr", feedLayout: "short", postsPerPage: 7,
    newsletterEnabled: true, newsletterTitle: "Bülten", newsletterTitleEn: "Newsletter", newsletterDescription: "Haftalık notlar", newsletterDescriptionEn: "Weekly notes",
    showSubscriberCount: true, contactEmail: "merhaba@diji.news", maintenanceMode: false,
    modulePosts: true, moduleNewsletter: true, moduleAds: true, moduleAnalytics: true,
  };

  test("accepts the defaults", () => {
    assert.equal(settingsSchema.safeParse(base).success, true);
  });

  test("clamps postsPerPage to 3–20 and requires an integer", () => {
    assert.equal(settingsSchema.safeParse({ ...base, postsPerPage: 2 }).success, false);
    assert.equal(settingsSchema.safeParse({ ...base, postsPerPage: 21 }).success, false);
    assert.equal(settingsSchema.safeParse({ ...base, postsPerPage: 7.5 }).success, false);
  });

  test("rejects an about text shorter than 20 characters", () => {
    assert.equal(settingsSchema.safeParse({ ...base, aboutText: "kısa" }).success, false);
    assert.equal(settingsSchema.safeParse({ ...base, aboutTextEn: "short" }).success, false);
  });

  test("rejects unknown enum values and a malformed contact address", () => {
    assert.equal(settingsSchema.safeParse({ ...base, feedLayout: "grid" }).success, false);
    assert.equal(settingsSchema.safeParse({ ...base, language: "de" }).success, false);
    assert.equal(settingsSchema.safeParse({ ...base, contactEmail: "merhaba" }).success, false);
  });
});
