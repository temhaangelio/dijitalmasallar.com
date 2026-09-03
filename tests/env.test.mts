import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath, getAppUrl, isSupabaseConfigured } from "../src/lib/env.ts";

describe("safeNextPath", () => {
  test("keeps in-app paths", () => {
    assert.equal(safeNextPath("/yazilar"), "/yazilar");
    assert.equal(safeNextPath("/istatistik?aralik=all"), "/istatistik?aralik=all");
  });

  test("rejects protocol-relative and absolute URLs", () => {
    // `//evil.com` is what a naive `startsWith("/")` check lets through.
    assert.equal(safeNextPath("//evil.com"), "/dashboard");
    assert.equal(safeNextPath("//evil.com/path"), "/dashboard");
    assert.equal(safeNextPath("https://evil.com"), "/dashboard");
    assert.equal(safeNextPath("http://evil.com"), "/dashboard");
  });

  test("rejects backslash tricks browsers normalise to slashes", () => {
    assert.equal(safeNextPath("/\\evil.com"), "/dashboard");
    assert.equal(safeNextPath("\\\\evil.com"), "/dashboard");
  });

  test("falls back for empty input", () => {
    assert.equal(safeNextPath(null), "/dashboard");
    assert.equal(safeNextPath(undefined), "/dashboard");
    assert.equal(safeNextPath(""), "/dashboard");
    assert.equal(safeNextPath("yazilar"), "/dashboard");
  });

  test("honours a custom fallback", () => {
    assert.equal(safeNextPath("//evil.com", "/giris"), "/giris");
  });
});

describe("getAppUrl", () => {
  test("prefers the configured URL and drops the trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dijitalmasallar.com/";
    assert.equal(getAppUrl(), "https://dijitalmasallar.com");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  test("falls back to localhost when nothing is configured", () => {
    const app = process.env.NEXT_PUBLIC_APP_URL;
    const vercel = process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    assert.equal(getAppUrl(), "http://localhost:3000");
    if (app) process.env.NEXT_PUBLIC_APP_URL = app;
    if (vercel) process.env.VERCEL_URL = vercel;
  });
});

describe("isSupabaseConfigured", () => {
  test("needs both the URL and the anon key", () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isSupabaseConfigured(), false);
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    assert.equal(isSupabaseConfigured(), true);
    if (url) process.env.NEXT_PUBLIC_SUPABASE_URL = url; else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (key) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key; else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });
});

// ---------------------------------------------------------------------------

import { defaultVisitorLanguage, languageFromAcceptLanguage, languageHref, resolveVisitorLanguage } from "../src/lib/visitor-language.ts";

describe("resolveVisitorLanguage", () => {
  test("Turkish is the primary language", () => {
    assert.equal(defaultVisitorLanguage, "tr");
    assert.equal(resolveVisitorLanguage(undefined), "tr");
    assert.equal(resolveVisitorLanguage(null), "tr");
    assert.equal(resolveVisitorLanguage(""), "tr");
    assert.equal(resolveVisitorLanguage("en"), "en");
  });

  test("only an explicit en switches to English", () => {
    assert.equal(resolveVisitorLanguage("tr"), "tr");
    assert.equal(resolveVisitorLanguage("EN"), "tr");
    assert.equal(resolveVisitorLanguage("de"), "tr");
  });
});

describe("languageFromAcceptLanguage", () => {
  test("selects Turkish when it is the browser's primary language", () => {
    assert.equal(languageFromAcceptLanguage("tr-TR,tr;q=0.9,en;q=0.8"), "tr");
    assert.equal(languageFromAcceptLanguage("tr,en;q=0.5"), "tr");
  });

  test("selects English only when it is the browser's primary language", () => {
    assert.equal(languageFromAcceptLanguage("en-US,en;q=0.9,tr;q=0.8"), "en");
    assert.equal(languageFromAcceptLanguage("de-DE,tr;q=0.9"), "tr");
    assert.equal(languageFromAcceptLanguage(null), "tr");
  });

  test("honours quality weights", () => {
    assert.equal(languageFromAcceptLanguage("en;q=0.5,tr;q=0.9"), "tr");
  });
});

describe("languageHref", () => {
  test("leaves the default language out of the URL", () => {
    assert.equal(languageHref("/", "tr"), "/");
    assert.equal(languageHref("/hakkinda", "tr"), "/hakkinda");
    assert.equal(languageHref("/haber/abc", "tr"), "/haber/abc");
  });

  test("marks English explicitly", () => {
    assert.equal(languageHref("/", "en"), "/?lang=en");
    assert.equal(languageHref("/hakkinda", "en"), "/hakkinda?lang=en");
  });

  test("merges extra query values", () => {
    assert.equal(languageHref("/", "tr", { limit: 20 }), "/?limit=20");
    assert.equal(languageHref("/", "en", { limit: 20 }), "/?lang=en&limit=20");
  });
});
