import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath, getAppUrl, isSupabaseConfigured } from "../src/lib/env.ts";

describe("safeNextPath", () => {
  test("keeps in-app paths", () => {
    assert.equal(safeNextPath("/yazilar"), "/yazilar");
    assert.equal(safeNextPath("/ayarlar/genel?sekme=1"), "/ayarlar/genel?sekme=1");
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
    process.env.NEXT_PUBLIC_APP_URL = "https://diji.news/";
    assert.equal(getAppUrl(), "https://diji.news");
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
